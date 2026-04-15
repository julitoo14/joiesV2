import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';

describe('UsersModule (e2e)', () => {
    let app: INestApplication;
    let mongoServer: MongoMemoryServer;

    const MOCK_ADMIN_ID = new Types.ObjectId().toString();
    const MOCK_USER_ID = new Types.ObjectId().toString();

    // Guard Mocker: lo cambiamos bajo demanda según qué queramos testear
    const mockJwtAuthGuard = {
        canActivate: jest.fn().mockImplementation((context: any) => {
            const req = context.switchToHttp().getRequest();
            req.user = { userId: MOCK_USER_ID }; // Por omisión entra como user normal
            return true;
        }),
    };

    beforeAll(async () => {
        // Mongo en memoria
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URI = mongoServer.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Seedear dos tipos de usuario
        const db = mongoose.createConnection(process.env.MONGO_URI);
        const UserCollection = db.collection('users');

        await UserCollection.insertMany([
            {
                _id: new Types.ObjectId(MOCK_ADMIN_ID),
                name: 'Admin Boss',
                email: 'boss@joies.com',
                password: 'hashed1',
                role: 'admin',
                status: 'active'
            },
            {
                _id: new Types.ObjectId(MOCK_USER_ID),
                name: 'Pepe Normal',
                email: 'pepe@joies.com',
                password: 'hashed2',
                role: 'user',
                status: 'active'
            }
        ]);

        await db.close();
    });

    afterAll(async () => {
        await app.close();
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('/users/me (GET) - Debería ver el perfil propio', async () => {
        const response = await request(app.getHttpServer())
            .get('/users/me')
            .expect(200);

        expect(response.body.email).toBe('pepe@joies.com');
        expect(response.body.name).toBe('Pepe Normal');
    });

    it('/users (GET) - Lista de perfiles accesibles', async () => {
        const response = await request(app.getHttpServer())
            .get('/users')
            .expect(200);

        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBe(2);
    });

    it('/users/:id (PATCH) - Puede editarse a sí mismo', async () => {
        const response = await request(app.getHttpServer())
            .patch(`/users/${MOCK_USER_ID}`)
            .send({ name: 'Pepe Muteado' })
            .expect(200);

        expect(response.body.name).toBe('Pepe Muteado');
    });

    it('/users/:id (PATCH) - Falla si Normal User quiere editar otro ID', async () => {
        await request(app.getHttpServer())
            .patch(`/users/${MOCK_ADMIN_ID}`)
            .send({ name: 'Hack intento' })
            .expect(401); // Unauthorized
    });

    it('/users/:id (DELETE) - Normal User no puede borrar', async () => {
        mockJwtAuthGuard.canActivate.mockImplementationOnce((context: any) => {
            context.switchToHttp().getRequest().user = { userId: MOCK_USER_ID };
            return true;
        });

        // Pepe intentando borrar a Admin
        await request(app.getHttpServer())
            .delete(`/users/${MOCK_ADMIN_ID}`)
            .expect(401);
    });

    it('/users/:id (DELETE) - Un Admin puede eliminar la cuenta de Pepe', async () => {
        // Temporalmente obligamos al guard a ser Admin Boss
        mockJwtAuthGuard.canActivate.mockImplementationOnce((context: any) => {
            context.switchToHttp().getRequest().user = { userId: MOCK_ADMIN_ID };
            return true;
        });

        await request(app.getHttpServer())
            .delete(`/users/${MOCK_USER_ID}`)
            .expect(200);
            
        // Verificamos que se borro Pepe
        const response = await request(app.getHttpServer()).get('/users').expect(200);
        expect(response.body.length).toBe(1); // Solo queda el admin
    });
});
