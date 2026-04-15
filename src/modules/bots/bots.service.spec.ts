import { Test, TestingModule } from '@nestjs/testing';
import { BotsService } from './bots.service';
import { getModelToken } from '@nestjs/mongoose';
import { BotPersistence } from './infrastructure/bot.schema';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

describe('BotsService', () => {
    let service: BotsService;

    // Base de datos de bots en memoria (simulada)
    const mockBot1 = { _id: 'b-1', userId: 'user-1', pair: 'BTCUSDT', status: 'STOPPED', save: jest.fn().mockResolvedValue(true) };
    const mockBot2 = { _id: 'b-2', userId: 'user-2', pair: 'ETHUSDT', status: 'RUNNING', save: jest.fn().mockResolvedValue(true) };

    const dbStore = [mockBot1, mockBot2];

    const mockBotModel = {
        new: jest.fn(),
        constructor: jest.fn(),
        find: jest.fn().mockReturnThis(),
        findById: jest.fn(),
        deleteOne: jest.fn().mockReturnThis(),
        exec: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BotsService,
                { provide: getModelToken(BotPersistence.name), useValue: mockBotModel }
            ],
        }).compile();

        service = module.get<BotsService>(BotsService);
        jest.clearAllMocks();
    });

    describe('getBotById/Validador Dueños', () => {
        it('debería retornar NotFoundException si la id no hace match en DB', async () => {
            mockBotModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

            await expect(service.getBotById('fake-id')).rejects.toThrow(NotFoundException);
        });

        it('updateBot debería arrojar Unauthorized si el userId no coincide con el del dueño', async () => {
             mockBotModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockBot1) });

             // user-2 quiere hackear a user-1
             await expect(service.updateBot('user-2', 'b-1', { status: 'RUNNING' })).rejects.toThrow(UnauthorizedException);
        });

        it('updateBotStatus debería asegurar limpieza y guardar el nuevo estado aislando al dueño', async () => {
            mockBotModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockBot1) });

            await service.updateBotStatus('user-1', 'b-1', 'RUNNING');

            expect(mockBot1.status).toBe('RUNNING');
            expect(mockBot1.save).toHaveBeenCalled();
        });

        it('deleteBot arroja Unauthorized si no es el dueño', async () => {
            mockBotModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockBot1) });
            await expect(service.deleteBot('user-2', 'b-1')).rejects.toThrow(UnauthorizedException);
        });
    });
});
