import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = UserPersistence & Document;

@Schema({ timestamps: true, collection: 'users' })
export class UserPersistence {

    // Nota: Mongo crea el _id solo, por lo que no lo defino como @Prop

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ default: 'user', enum: ['user', 'admin'] }) // Change default role from seller to user
    role: string;

    @Prop({ default: Date.now })
    lastActiveAt: Date;

    @Prop({ default: 'active', enum: ['active', 'inactive', 'suspended'] })
    status: string;

    @Prop({ default: 0 })
    botCount: number;

    @Prop({ default: 'FREE', enum: ['FREE', 'PRO', 'UNLIMITED'] })
    plan: string;

    @Prop({ type: Object })
    binanceConfig?: {
        apiKey: string;
        apiSecret: string;
    };

    @Prop({ type: Object, default: { currency: 'USD', theme: 'light', alertsEnabled: true } })
    preferences?: {
        currency?: string;
        theme?: string;
        alertsEnabled?: boolean;
    };
}

export const UserSchema = SchemaFactory.createForClass(UserPersistence);