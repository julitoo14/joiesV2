import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserPersistence, UserSchema } from './infrastructure/user.schema';
import { MongoUserRepository } from './infrastructure/mongo-user.repository';
import { UsersService } from './users.service';

@Module({
    imports: [
        // Registramos el esquema para que el Repositorio de Mongo funcione
        MongooseModule.forFeature([{ name: UserPersistence.name, schema: UserSchema }]),
    ],
    providers: [
        UsersService,
        {
            // IMPORTANTE: Este string debe coincidir con el @Inject del Service
            provide: 'IUserRepository',
            useClass: MongoUserRepository,
        },
    ],
    exports: [UsersService], // Lo exportamos para que otros módulos lo vean
})
export class UsersModule { }