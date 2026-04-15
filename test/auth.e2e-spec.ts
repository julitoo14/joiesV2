import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserPersistence } from '../src/modules/users/infrastructure/user.schema';

describe('AuthModule (e2e)', () => {
    let app: INestApplication;
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        // Levantar entorno Mongo Temporal
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URI = mongoServer.getUri();

        // Necesario para que bcrypt y JWT tengan sus variables
        process.env.JWT_SECRET = 'test-secret';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Seedar usuario válido en MongoDB para probar el login
        const db = mongoose.createConnection(process.env.MONGO_URI);
        const UserCollection = db.collection('users');
        const hashedPassword = await bcrypt.hash('Contraseña123!', 10);

        await UserCollection.insertOne({
            name: 'Julián',
            email: 'admin@joies.com',
            password: hashedPassword,
            role: 'admin',
            status: 'active'
        });

        await db.close();
    });

    afterAll(async () => {
        await app.close();
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('/auth/login (POST) - Inicio de sesión exitoso por LocalAuthGuard', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'admin@joies.com',
                password: 'Contraseña123!'
            })
            .expect(201); // Created

        expect(response.body).toHaveProperty('access_token');
        
        // Verificamos que el JWT desencriptado tenga la info
        const tokenParts = response.body.access_token.split('.');
        expect(tokenParts).toHaveLength(3);
    });

    it('/auth/login (POST) - Falla si la contraseña es incorrecta (401)', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'admin@joies.com',
                password: 'Mal-password' // Errónea
            })
            .expect(401);
    });

    it('/auth/login (POST) - Falla si el email no existe (401)', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'fantasma@joies.com',
                password: 'Contraseña123!'
            })
            .expect(401);
    });

    it('/auth/register (POST) - Registra exitosamente al usuario y recibe token', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'nuevo@joies.com',
                password: 'PassSegura123',
                name: 'Usuario Nuevo'
            })
            .expect(201); // Created

        expect(response.body).toHaveProperty('access_token');
        
        // Comprobar que en base de datos quedó guardado con bcrypt
        const db = mongoose.createConnection(process.env.MONGO_URI!);
        const UserCollection = db.collection('users');
        const user = await UserCollection.findOne({ email: 'nuevo@joies.com' });
        
        expect(user).toBeDefined();
        expect(user!.name).toBe('Usuario Nuevo');
        expect(user!.role).toBe('user');
        expect(user!.password).not.toBe('PassSegura123'); // Verifica el hashing
        expect(user!.password.startsWith('$2b$')).toBeTruthy(); // Bcrypt header
        
        await db.close();
    });

    it('/auth/register (POST) - Falla porque el correo ya existe (401)', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'nuevo@joies.com', // Ya creado en la prueba anterior
                password: 'Otra',
                name: 'Copia'
            })
            .expect(401);
    });
});
