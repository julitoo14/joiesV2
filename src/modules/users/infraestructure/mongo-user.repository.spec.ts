import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MongoUserRepository } from './mongo-user.repository';
import { UserPersistence, UserSchema } from './user.schema';
import { User } from '../domain/user.entity';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';

describe('MongoUserRepository', () => {
    let repository: MongoUserRepository;
    let mongod: MongoMemoryServer;
    let mongoConnection: Connection;
    let userModel: Model<UserPersistence>;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        mongoConnection = (await connect(uri)).connection;
        userModel = mongoConnection.model(UserPersistence.name, UserSchema);

        repository = new MongoUserRepository(userModel as any);
    });

    afterAll(async () => {
        await mongoConnection.dropDatabase();
        await mongoConnection.close();
        await mongod.stop();
    });

    it('debería guardar y recuperar un usuario correctamente', async () => {
        const user = new User({ name: 'Julián', username: 'juliantest', role: 'admin' });

        // Guardamos
        const savedUser = await repository.save(user);

        // Buscamos
        const foundUser = await repository.findOneByUsername('juliantest');

        expect(foundUser).toBeDefined();
        expect(foundUser?.name).toBe('Julián');
        expect(foundUser?.isAdmin()).toBe(true); // ¡Acá probás que el mapper devolvió una Entidad real!
    });
});