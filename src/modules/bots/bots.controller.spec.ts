import { Test, TestingModule } from '@nestjs/testing';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { BotManagerService } from './engine/bot-manager.service';

describe('BotsController', () => {
    let controller: BotsController;

    const mockBotsService = {
        createBot: jest.fn(),
        getBotsByUser: jest.fn(),
        getBotById: jest.fn(),
        updateBot: jest.fn(),
        updateBotStatus: jest.fn(),
        deleteBot: jest.fn(),
    };

    const mockBotManagerService = {
        getActiveInstance: jest.fn(),
        startBot: jest.fn(),
        pauseBot: jest.fn(),
        resumeBot: jest.fn(),
        stopBot: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BotsController],
            providers: [
                { provide: BotsService, useValue: mockBotsService },
                { provide: BotManagerService, useValue: mockBotManagerService },
            ],
        }).compile();

        controller = module.get<BotsController>(BotsController);
        jest.clearAllMocks();
    });

    const mockRequest = { user: { userId: 'user-1' } };

    describe('getBot', () => {
        it('debería retornar el bot si pertenece al usuario', async () => {
            const expectedBot = { _id: 'bot-1', userId: 'user-1', pair: 'BTCUSDT' };
            mockBotsService.getBotById.mockResolvedValue(expectedBot);

            const result = await controller.getBot(mockRequest, 'bot-1');

            expect(result).toEqual(expectedBot);
        });

        it('debería rechazar si el bot le pertenece a otro usuario', async () => {
            const externalBot = { _id: 'bot-1', userId: 'user-HACKER', pair: 'BTCUSDT' };
            mockBotsService.getBotById.mockResolvedValue(externalBot);

            await expect(controller.getBot(mockRequest, 'bot-1')).rejects.toThrow('No autorizado');
        });
    });

    describe('updateBot (Live Update Settings)', () => {
        it('debería aplicar las configuraciones en memoria viva si el bot está montado', async () => {
            const updateData = { settings: { lowerPrice: 50000 } };
            mockBotsService.updateBot.mockResolvedValue(true);
            
            const mockInstance = { applySettings: jest.fn() };
            mockBotManagerService.getActiveInstance.mockReturnValue(mockInstance);

            await controller.updateBot(mockRequest, 'bot-1', updateData);

            expect(mockBotsService.updateBot).toHaveBeenCalledWith('user-1', 'bot-1', updateData);
            expect(mockInstance.applySettings).toHaveBeenCalledWith(updateData.settings);
        });
    });

    describe('Motor Actions', () => {
        it('debería actualizar estado a RUNNING y usar BotManager para el start', async () => {
            mockBotsService.updateBotStatus.mockResolvedValue({ status: 'RUNNING' });
            
            const result = await controller.startBot(mockRequest, 'bot-1');

            expect(mockBotsService.updateBotStatus).toHaveBeenCalledWith('user-1', 'bot-1', 'RUNNING');
            expect(mockBotManagerService.startBot).toHaveBeenCalledWith('bot-1');
            expect(result.status).toBe('RUNNING');
        });

        it('debería detener el motor en memoria tras un DELETE', async () => {
            await controller.removeBot(mockRequest, 'bot-1');

            expect(mockBotManagerService.stopBot).toHaveBeenCalledWith('bot-1');
            expect(mockBotsService.deleteBot).toHaveBeenCalledWith('user-1', 'bot-1');
        });
    });
});
