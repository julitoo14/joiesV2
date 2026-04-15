import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/domain/user.entity';
import * as bcrypt from 'bcrypt';

// Mockeamos bcrypt para que no dependa de hashing real en los tests
jest.mock('bcrypt');

describe('AuthService', () => {
    let authService: AuthService;

    const mockUsersService: any = {
        findOneByEmail: jest.fn(),
        create: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);

        // Limpiamos los mocks entre tests
        jest.clearAllMocks();
    });

    describe('validateUser', () => {
        it('debería retornar el usuario (sin password) si las credenciales son válidas', async () => {
            const user = new User({
                id: 'user-1',
                name: 'Julián',
                email: 'julian@test.com',
                password: 'hashed-password',
                role: 'admin',
            });

            mockUsersService.findOneByEmail.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await authService.validateUser('julian@test.com', 'plain-password');

            expect(result).toBeDefined();
            expect(result.email).toBe('julian@test.com');
            expect(result.name).toBe('Julián');
            expect(result).not.toHaveProperty('password');
            expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('julian@test.com');
            expect(bcrypt.compare).toHaveBeenCalledWith('plain-password', 'hashed-password');
        });

        it('debería retornar null si el email no existe', async () => {
            mockUsersService.findOneByEmail.mockResolvedValue(null);

            const result = await authService.validateUser('noexiste@test.com', 'password');

            expect(result).toBeNull();
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it('debería retornar null si la contraseña es incorrecta', async () => {
            const user = new User({
                id: 'user-1',
                name: 'Julián',
                email: 'julian@test.com',
                password: 'hashed-password',
            });

            mockUsersService.findOneByEmail.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await authService.validateUser('julian@test.com', 'wrong-password');

            expect(result).toBeNull();
            expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
        });
    });

    describe('login', () => {
        it('debería retornar un access_token firmado con los datos del usuario', async () => {
            const userPayload = {
                id: 'user-1',
                email: 'julian@test.com',
                role: 'admin',
            };

            mockJwtService.sign.mockReturnValue('mocked-jwt-token');

            const result = await authService.login(userPayload);

            expect(result).toEqual({ access_token: 'mocked-jwt-token' });
            expect(mockJwtService.sign).toHaveBeenCalledWith({
                sub: 'user-1',
                email: 'julian@test.com',
                role: 'admin',
            });
        });

        it('debería incluir sub, email y role en el payload del JWT', async () => {
            const userPayload = {
                id: 'user-2',
                email: 'trader@test.com',
                role: 'user',
            };

            mockJwtService.sign.mockReturnValue('another-token');

            await authService.login(userPayload);

            const signCall = mockJwtService.sign.mock.calls[0][0];
            expect(signCall).toHaveProperty('sub', 'user-2');
            expect(signCall).toHaveProperty('email', 'trader@test.com');
            expect(signCall).toHaveProperty('role', 'user');
        });
    });

    describe('register', () => {
        it('debería encriptar contraseña y delegar la creación al usersService', async () => {
            const rawData = {
                email: 'test@joies.com',
                password: 'plain_password',
                name: 'Joies Test'
            };

            const newUserMock = new User({
                id: 'id-register',
                email: 'test@joies.com',
                name: 'Joies Test',
                role: 'user',
            });

            // Mock bcrypt.hash
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
            mockUsersService.create = jest.fn().mockResolvedValue(newUserMock);
            
            // Mock de nuestro propio authService.login para verificar que pasa al login post-register
            const loginSpy = jest.spyOn(authService, 'login').mockResolvedValue({ access_token: 'magical_register_token' });

            const result = await authService.register(rawData);

            expect(bcrypt.hash).toHaveBeenCalledWith('plain_password', 10);
            
            expect(mockUsersService.create).toHaveBeenCalledWith({
                email: 'test@joies.com',
                name: 'Joies Test',
                password: 'hashed_password',
                role: 'user', // verifica seguridad manual
            });

            expect(loginSpy).toHaveBeenCalledWith(newUserMock.toJSON());
            expect(result).toEqual({ access_token: 'magical_register_token' });
            
            loginSpy.mockRestore(); // limpieza
        });
    });
});
