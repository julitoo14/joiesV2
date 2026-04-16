import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BotPersistence, BotDocument } from './infrastructure/bot.schema';

@Injectable()
export class BotsService {
    constructor(
        @InjectModel(BotPersistence.name) private botModel: Model<BotDocument>,
    ) { }

    async createBot(userId: string, data: Partial<BotPersistence>): Promise<BotDocument> {
        if (data.type === 'GRID' && data.settings) {
            this.validateGridSettings(data.settings);
        }
        const bot = new this.botModel({ ...data, userId, status: 'STOPPED' });
        return bot.save();
    }

    private validateGridSettings(settings: any) {
        const { capital, gridLines, lowerPrice, upperPrice } = settings;

        if (!capital || capital <= 0) throw new BadRequestException('El capital debe ser mayor a 0');
        if (!gridLines || gridLines < 2) throw new BadRequestException('Se requieren al menos 2 líneas de grilla');
        if (!lowerPrice || lowerPrice <= 0) throw new BadRequestException('El precio inferior debe ser mayor a 0');
        if (!upperPrice || upperPrice <= lowerPrice) throw new BadRequestException('El precio superior debe ser mayor al inferior');

        const capitalPerGrid = capital / gridLines;
        if (capitalPerGrid < 5.5) {
            throw new BadRequestException(`Inversión insuficiente. Cada nivel debe tener al menos 5.5 USDT (actual: ${capitalPerGrid.toFixed(2)} USDT)`);
        }
    }

    async getBotsByUser(userId: string): Promise<BotDocument[]> {
        return this.botModel.find({ userId }).exec();
    }

    async getBotById(id: string): Promise<BotDocument> {
        const bot = await this.botModel.findById(id).exec();
        if (!bot) {
            throw new NotFoundException(`El bot con ID ${id} no existe.`);
        }
        return bot;
    }

    async updateBot(userId: string, id: string, updateData: Partial<BotPersistence>): Promise<BotDocument> {
        const bot = await this.getBotById(id);
        
        if (bot.userId !== userId) {
            throw new UnauthorizedException('No tienes permisos para modificar este bot.');
        }

        // Ignoramos id y userId del updateDate para evitar inyecciones de dueños
        const { userId: _, status: __, ...safeUpdates } = updateData as any;

        Object.assign(bot, safeUpdates);
        return bot.save();
    }

    async updateBotStatus(userId: string, id: string, status: 'STOPPED' | 'RUNNING' | 'PAUSED'): Promise<BotDocument> {
        const bot = await this.getBotById(id);
        
        if (bot.userId !== userId) {
            throw new UnauthorizedException('No tienes permisos para modificar este bot.');
        }

        bot.status = status;
        return bot.save();
    }

    async deleteBot(userId: string, id: string): Promise<void> {
        const bot = await this.getBotById(id);
        
        if (bot.userId !== userId) {
            throw new UnauthorizedException('No tienes permisos para eliminar este bot.');
        }

        await this.botModel.deleteOne({ _id: id }).exec();
    }

    // Usado por el Motor (Engine) para persistir info de ejecución sin validación de usuario (es interno)
    async updateBotPersistence(id: string, state: any, stats: any): Promise<void> {
        await this.botModel.updateOne({ _id: id }, { $set: { state, stats } }).exec();
    }

    // Usado por el BotManager al arranque de la App para cargar los pre-existentes
    async findBotsByStatus(status: 'RUNNING' | 'PAUSED'): Promise<BotDocument[]> {
        return this.botModel.find({ status }).exec();
    }
}
