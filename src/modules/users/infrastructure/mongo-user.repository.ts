// Este archivo es el que se encarga de la persistencia de datos en MongoDB,
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUserRepository } from '../repositories/user-repository.interface';
import { User } from '../domain/user.entity';
import { UserPersistence, UserDocument } from './user.schema';
import { UserMapper } from './user.mapper';
import { Types } from 'mongoose';

@Injectable()
export class MongoUserRepository implements IUserRepository {
    constructor(
        @InjectModel(UserPersistence.name) private readonly userModel: Model<UserDocument>,
    ) { }

    async save(user: User): Promise<User> {
        const persistenceData = UserMapper.toPersistence(user);

        // Si no tiene ID, usamos un ID de Mongo nuevo o dejamos que Mongo lo cree
        const id = user.id ? user.id : new Types.ObjectId().toHexString();

        const updatedUser = await this.userModel.findByIdAndUpdate(
            id,
            { $set: persistenceData },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
        ).exec();

        return UserMapper.toDomain(updatedUser);
    }

    async findOneByEmail(email: string): Promise<User | null> {
        const userDoc = await this.userModel.findOne({ email }).exec();
        if (!userDoc) return null;
        return UserMapper.toDomain(userDoc);
    }

    async findOneById(id: string): Promise<User | null> {
        const userDoc = await this.userModel.findById(id).exec();
        if (!userDoc) return null;
        return UserMapper.toDomain(userDoc);
    }

    async emailExists(email: string): Promise<boolean> {
        const userDoc = await this.userModel.findOne({ email }).exec();
        return !!userDoc;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.userModel.findByIdAndDelete(id).exec();
        return !!result;
    }

    async findAll(): Promise<User[]> {
        const users = await this.userModel.find().exec();
        return users.map(user => UserMapper.toDomain(user));
    }
}