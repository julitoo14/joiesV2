import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BotDocument = BotPersistence & Document;

@Schema({ timestamps: true, collection: 'bots' })
export class BotPersistence {
    @Prop({ type: String, required: true }) // Vincula el bot con su dueño (MongoDB user ID o string normal si usas UUIDs)
    userId: string;

    @Prop({ type: String, required: true }) // Ej: 'BTCUSDT'
    pair: string;

    @Prop({ type: String, required: true, enum: ['GRID'] }) // Para el patrón strategy, si luego sumas "DCA", etc.
    type: string;

    @Prop({ type: String, required: true, enum: ['STOPPED', 'RUNNING', 'PAUSED'], default: 'STOPPED' })
    status: 'STOPPED' | 'RUNNING' | 'PAUSED';

    @Prop({ type: Object, default: {} }) // Aquí vivirán los parámetros como lowerPrice, upperPrice, etc.
    settings: any;

    @Prop({ type: Object, default: { activeOrders: {}, gridLevels: [] } }) // Estado actual de la grilla en memoria persistente
    state: {
        activeOrders: Record<string, any>; // mapping of level index to order info
        gridLevels: number[];
        initialPrice?: number;
    };

    @Prop({ type: Object, default: { totalSales: 0, profitGross: 0, profitNet: 0 } }) // Datos acumulados
    stats: {
        totalSales: number;
        profitGross: number;
        profitNet: number;
    };
}

export const BotSchema = SchemaFactory.createForClass(BotPersistence);
