import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { BotsService } from './bots.service';
import { BotManagerService } from './engine/bot-manager.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BotPersistence } from './infrastructure/bot.schema';

@Controller('bots')
@UseGuards(JwtAuthGuard)
export class BotsController {
    constructor(
        private readonly botsService: BotsService,
        private readonly botManager: BotManagerService,
    ) { }

    @Post()
    async createBot(@Request() req: any, @Body() data: Partial<BotPersistence>) {
        return this.botsService.createBot(req.user.userId, data);
    }

    @Get()
    async getBots(@Request() req: any) {
        return this.botsService.getBotsByUser(req.user.userId);
    }

    @Get(':id')
    async getBot(@Request() req: any, @Param('id') botId: string) {
        const bot = await this.botsService.getBotById(botId);
        // Validar dueño (tambien podríamos hacerlo en el service, pero como es lectura pura:
        if (bot.userId !== req.user.userId) {
            throw new Error('No autorizado');
        }
        return bot;
    }

    @Put(':id')
    async updateBot(
        @Request() req: any,
        @Param('id') botId: string,
        @Body() updateData: Partial<BotPersistence>,
    ) {
        const updated = await this.botsService.updateBot(req.user.userId, botId, updateData);
        
        // Magia: Aplicar settings "en vivo" si el bot está cargado sin necesidad de detenerlo
        const instance = this.botManager.getActiveInstance(botId);
        if (instance && updateData.settings) {
            instance.applySettings(updateData.settings);
        }
        
        return updated;
    }

    @Delete(':id')
    async removeBot(@Request() req: any, @Param('id') botId: string) {
        // Detiene el motor si está corriendo
        await this.botManager.stopBot(botId);
        // Lo borra de la DB
        return this.botsService.deleteBot(req.user.userId, botId);
    }

    // --- ENDPOINTS DE TIPO ACCIONES (MOTOR) ---

    @Post(':id/start')
    async startBot(@Request() req: any, @Param('id') botId: string) {
        let bot = await this.botsService.updateBotStatus(req.user.userId, botId, 'RUNNING');
        try {
            await this.botManager.startBot(botId);
            return { message: 'Bot iniciado', status: bot.status };
        } catch (error: any) {
            // Revertimos a STOPPED en la DB porque falló al iniciar en memoria (ej: llaves erróneas)
            bot = await this.botsService.updateBotStatus(req.user.userId, botId, 'STOPPED');
            throw new BadRequestException(error.message || 'Error al iniciar el bot');
        }
    }

    @Post(':id/pause')
    async pauseBot(@Request() req: any, @Param('id') botId: string) {
        const bot = await this.botsService.updateBotStatus(req.user.userId, botId, 'PAUSED');
        await this.botManager.pauseBot(botId);
        return { message: 'Bot pausado', status: bot.status };
    }

    @Post(':id/resume')
    async resumeBot(@Request() req: any, @Param('id') botId: string) {
        const bot = await this.botsService.updateBotStatus(req.user.userId, botId, 'RUNNING');
        await this.botManager.resumeBot(botId);
        return { message: 'Bot reanudado', status: bot.status };
    }

    @Post(':id/stop')
    async stopBot(@Request() req: any, @Param('id') botId: string) {
        const bot = await this.botsService.updateBotStatus(req.user.userId, botId, 'STOPPED');
        await this.botManager.stopBot(botId);
        return { message: 'Bot apagado y retirado de memoria', status: bot.status };
    }
}
