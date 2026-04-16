import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { BaseBotExecutor } from './base-bot.executor';
import { GridBotExecutor } from './grid-bot.executor';
import { BotsService } from '../bots.service';
import { BotDocument } from '../infrastructure/bot.schema';
import { UsersService } from '../../users/users.service';

@Injectable()
export class BotManagerService implements OnModuleInit {
    private readonly logger = new Logger(BotManagerService.name);
    // Diccionario en memoria de los bots activos (key: Mongo Id)
    private botsMap = new Map<string, BaseBotExecutor>();

    constructor(
        private readonly botsService: BotsService,
        private readonly usersService: UsersService,
    ) { }

    async onModuleInit() {
        this.logger.log('Inicializando motor de bots...');
        // Buscar todos los bots que estaban RUNNING o PAUSED antes de que el servidor se apague
        const activeBots = await this.botsService.findBotsByStatus('RUNNING');
        const pausedBots = await this.botsService.findBotsByStatus('PAUSED');

        for (const bot of activeBots) {
            await this.initializeBot(bot);
            await this.startBot(bot._id.toString()); // Al inicializar, lo disparamos
        }

        for (const bot of pausedBots) {
            await this.initializeBot(bot);
            // El estado por defecto es inicializado, solo necesitamos asegurar que esté PAUSED en memoria
            const activeInstance = this.botsMap.get(bot._id.toString());
            if (activeInstance) {
                activeInstance.status = 'PAUSED';
            }
        }

        this.logger.log(`¡Motor arrancado con ${this.botsMap.size} bots en memoria!`);
    }

    /**
     * Construye la instancia del motor de trading según el Tipo (Strategy Pattern)
     */
    public async initializeBot(botEntity: BotDocument): Promise<BaseBotExecutor> {
        const idString = botEntity._id.toString();
        // En caso de que ya estuviera cargado, se limpia por seguridad
        if (this.botsMap.has(idString)) {
            const oldConf = this.botsMap.get(idString);
            oldConf?.stop();
            this.botsMap.delete(idString);
        }

        // Obtener el usuario para inyectar su API Key
        const user = await this.usersService.findOne(botEntity.userId);

        let executor: BaseBotExecutor;

        switch (botEntity.type) {
            case 'GRID':
                // Por defecto, físicamente la memoria arranca detenida hasta que reciba un .start() 
                executor = new GridBotExecutor(
                    idString, 
                    botEntity.pair, 
                    botEntity.settings, 
                    user.binanceConfig, 
                    'STOPPED',
                    async (state, stats) => {
                        await this.botsService.updateBotPersistence(idString, state, stats);
                    }
                );
                break;
            // Futuro: case 'DCA': executor = new DcaBotExecutor(...); break;
            default:
                throw new Error(`Tipo de bot no soportado: ${botEntity.type}`);
        }

        this.botsMap.set(idString, executor);
        return executor;
    }

    public getActiveInstance(botId: string): BaseBotExecutor | undefined {
        return this.botsMap.get(botId);
    }

    public async startBot(botId: string): Promise<void> {
        let instance = this.botsMap.get(botId);

        if (!instance) {
            // Si llamaron startBot pero el bot recién lo crean por base de datos, tenemos que instanciarlo primero.
            const botData = await this.botsService.getBotById(botId);
            instance = await this.initializeBot(botData);
        }

        if (instance.status === 'RUNNING') {
            throw new BadRequestException('El bot ya se encuentra en ejecución.');
        }

        await instance.start();
    }

    /**
     * Preview de arranque: Instancia temporalmente el bot para consultar balances y calcular la compra inicial.
     */
    public async previewStart(botId: string): Promise<any> {
        const botData = await this.botsService.getBotById(botId);
        const user = await this.usersService.findOne(botData.userId);

        // Creamos un executor temporal solo para el preview, sin registrarlo en el mapa
        const tempExecutor = new GridBotExecutor(
            botId,
            botData.pair,
            botData.settings,
            user.binanceConfig,
            'STOPPED',
        );

        return tempExecutor.previewStart();
    }

    public async pauseBot(botId: string): Promise<void> {
        const instance = this.botsMap.get(botId);
        if (!instance) throw new BadRequestException('El bot no está instanciado en memoria.');
        
        instance.pause();
    }

    public async resumeBot(botId: string): Promise<void> {
        const instance = this.botsMap.get(botId);
        if (!instance) throw new BadRequestException('El bot no está instanciado en memoria.');
        
        instance.resume();
    }

    public async stopBot(botId: string): Promise<void> {
        const instance = this.botsMap.get(botId);
        if (!instance) {
            this.logger.warn(`Intento de detener bot ${botId} que no estaba cargado en el engine.`);
            return;
        }

        await instance.stop();
        this.botsMap.delete(botId); // Lo sacamos por completo de circulación activa
    }
}
