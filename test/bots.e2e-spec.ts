import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { BotPersistence } from '../src/modules/bots/infrastructure/bot.schema';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import mongoose from 'mongoose';

// Usaremos un Guard falso para saltar la encriptación y validar fácil
const mockJwtAuthGuard = {
    canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        // Simulamos que el JWT desencriptado arrojó este user:
        req.user = { userId: 'mock-user-123' };
        return true;
    },
};

describe('BotsController (e2e)', () => {
    let app: INestApplication;
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        // Levantamos un Mongo temporal en memoria
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Pisa el env globalmente para que el AppModule lo agarre al inicializar MongooseModule
        process.env.MONGO_URI = mongoUri;

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // Estado compartido para guardar el ID entre tests
    let createdBotId: string;

    it('/bots (POST) - Debería crear un bot para el usuario', async () => {
        const response = await request(app.getHttpServer())
            .post('/bots')
            .send({
                pair: 'ETHUSDT',
                type: 'GRID',
                settings: { gridLines: 10 }
            })
            .expect(201); // Created

        expect(response.body).toBeDefined();
        expect(response.body.userId).toBe('mock-user-123');
        expect(response.body.pair).toBe('ETHUSDT');
        expect(response.body.status).toBe('STOPPED');
        
        createdBotId = response.body._id; // Lo guardamos para los próximos e2e
    });

    it('/bots (GET) - Debería ver el bot creado en la lista', async () => {
        const response = await request(app.getHttpServer())
            .get('/bots')
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]._id).toBe(createdBotId);
    });

    it('/bots/:id/start (POST) - Debería prender el bot y montarlo al BotManagerService', async () => {
        const response = await request(app.getHttpServer())
            .post(`/bots/${createdBotId}/start`)
            .expect(201); // NestJS devuelve 201 por default en POST

        expect(response.body.status).toBe('RUNNING');
        expect(response.body.message).toBe('Bot iniciado');
    });

    it('/bots/:id (PUT) - Debería modificar settings y verse reflejado', async () => {
        const response = await request(app.getHttpServer())
            .put(`/bots/${createdBotId}`)
            .send({
                settings: { gridLines: 50, newFeature: true }
            })
            .expect(200);

        expect(response.body.settings.gridLines).toBe(50);
        expect(response.body.settings.newFeature).toBe(true);
    });

    it('/bots/:id/pause (POST) - Debe pausar', async () => {
        const response = await request(app.getHttpServer())
            .post(`/bots/${createdBotId}/pause`)
            .expect(201);

        expect(response.body.status).toBe('PAUSED');
    });

    it('/bots/:id (DELETE) - Elimina el motor y borra la base de datos', async () => {
        await request(app.getHttpServer())
            .delete(`/bots/${createdBotId}`)
            .expect(200);

        // Verificamos que ya no existe
        const getList = await request(app.getHttpServer()).get('/bots');
        expect(getList.body.length).toBe(0);
    });
});
