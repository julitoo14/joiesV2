import { Test, TestingModule } from '@nestjs/testing';
import { BotManagerService } from './bot-manager.service';
import { BotsService } from '../bots.service';

describe('BotManagerService', () => {
    let service: BotManagerService;

    const mockBotsService = {
        findBotsByStatus: jest.fn(),
        getBotById: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BotManagerService,
                { provide: BotsService, useValue: mockBotsService }
            ],
        }).compile();

        service = module.get<BotManagerService>(BotManagerService);
        jest.clearAllMocks();
    });

    it('debería inicializar vació si no hay bots en DB al arrancar', async () => {
        mockBotsService.findBotsByStatus.mockResolvedValue([]);
        
        await service.onModuleInit();
        
        // Probamos pidiendo una key falsa
        expect(service.getActiveInstance('fake-id')).toBeUndefined();
    });

    it('debería construir GridBotExecutor para type=GRID', () => {
        const fakeBotEntity = {
            _id: { toString: () => 'bot-1' },
            type: 'GRID',
            pair: 'BTCUSDT',
            settings: {},
            status: 'STOPPED'
        } as any;

        const executor = service.initializeBot(fakeBotEntity);
        expect(executor.constructor.name).toBe('GridBotExecutor');
        expect(executor.pair).toBe('BTCUSDT');
        
        // Verifica que se guardó en el mapa
        expect(service.getActiveInstance('bot-1')).toBe(executor);
    });

    it('debería arrojar error para estrategias no soportadas', () => {
        const fakeBotEntity = {
            _id: { toString: () => 'bot-x' },
            type: 'DESCONOCIDO'
        } as any;

        expect(() => service.initializeBot(fakeBotEntity)).toThrow('Tipo de bot no soportado: DESCONOCIDO');
    });

    describe('Gestión de memoria ciclo de vida', () => {
        let fakeBotEntity: any;

        beforeEach(() => {
            fakeBotEntity = {
                _id: { toString: () => 'bot-lifecycle' },
                type: 'GRID',
                pair: 'ETHUSDT',
                settings: {},
                status: 'STOPPED'
            };
            service.initializeBot(fakeBotEntity);
        });

        it('pauseBot() cambia status y no lo remueve', async () => {
            // Fakeamos que arranca primero
            await service.startBot('bot-lifecycle');
            await service.pauseBot('bot-lifecycle');

            const inst = service.getActiveInstance('bot-lifecycle');
            expect(inst).toBeDefined();
            expect(inst!.status).toBe('PAUSED');
        });

        it('stopBot() frena procesos asíncronos y LO SACA del mapa', async () => {
            await service.startBot('bot-lifecycle');
            await service.stopBot('bot-lifecycle');

            expect(service.getActiveInstance('bot-lifecycle')).toBeUndefined();
        });
    });
});
