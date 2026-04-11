import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = UserPersistence & Document;

@Schema({ timestamps: true, collection: 'users' })
export class UserPersistence {

    // Nota: Mongo crea el _id solo, por lo que no lo defino como @Prop

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ default: 'seller', enum: ['seller', 'admin'] })
    role: string;

    @Prop({ default: Date.now })
    lastActiveAt: Date;

    @Prop({ type: Object }) // Se guarda el objeto de Tiendanube como un sub-documento
    tiendaNube?: {
        userId: string;
        accessToken: string;
    };
}

export const UserSchema = SchemaFactory.createForClass(UserPersistence);