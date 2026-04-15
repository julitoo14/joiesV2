import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
    let controller: AuthController;

    const mockAuthService = {
        login: jest.fn(),
        validateUser: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);

        jest.clearAllMocks();
    });

    describe('login', () => {
        it('debería retornar un access_token cuando el login es exitoso', async () => {
            // Simulamos que Passport ya validó al usuario y lo puso en req.user
            const mockRequest = {
                user: {
                    id: 'user-1',
                    email: 'julian@test.com',
                    role: 'admin',
                    name: 'Julián',
                },
            };

            mockAuthService.login.mockResolvedValue({
                access_token: 'mocked-jwt-token',
            });

            const result = await controller.login(mockRequest);

            expect(result).toEqual({ access_token: 'mocked-jwt-token' });
            expect(mockAuthService.login).toHaveBeenCalledWith(mockRequest.user);
        });

        it('debería pasar el objeto user del request al AuthService.login', async () => {
            const mockRequest = {
                user: {
                    id: 'user-2',
                    email: 'trader@test.com',
                    role: 'user',
                    name: 'Trader',
                },
            };

            mockAuthService.login.mockResolvedValue({
                access_token: 'another-token',
            });

            await controller.login(mockRequest);

            expect(mockAuthService.login).toHaveBeenCalledTimes(1);
            expect(mockAuthService.login).toHaveBeenCalledWith({
                id: 'user-2',
                email: 'trader@test.com',
                role: 'user',
                name: 'Trader',
            });
        });
    });
});
