import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './domain/user.entity';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('UsersController', () => {
    let controller: UsersController;

    // Usuarios de prueba reutilizables
    const adminUser = new User({ id: 'id-admin', name: 'Admin', email: 'admin@joies.com', role: 'admin' });
    const normalUser = new User({ id: 'id-user', name: 'Pepe', email: 'pepe@joies.com', role: 'user' });
    const allUsers = [adminUser, normalUser];

    const mockUsersService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                { provide: UsersService, useValue: mockUsersService },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);

        jest.clearAllMocks();
    });

    // ──────────────────────────────────────────────
    // GET /users
    // ──────────────────────────────────────────────
    describe('findAll', () => {
        it('debería retornar un array de usuarios', async () => {
            mockUsersService.findAll.mockResolvedValue(allUsers);

            const result = await controller.findAll();

            expect(result).toEqual(allUsers);
            expect(result).toHaveLength(2);
            expect(mockUsersService.findAll).toHaveBeenCalledTimes(1);
        });

        it('debería retornar un array vacío si no hay usuarios', async () => {
            mockUsersService.findAll.mockResolvedValue([]);

            const result = await controller.findAll();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });
    });

    // ──────────────────────────────────────────────
    // GET /users/me
    // ──────────────────────────────────────────────
    describe('getProfile', () => {
        it('debería retornar el perfil del usuario autenticado', async () => {
            const mockRequest = { user: { userId: normalUser.id } };
            mockUsersService.findOne.mockResolvedValue(normalUser);

            const result = await controller.getProfile(mockRequest);

            expect(result).toEqual(normalUser);
            expect(mockUsersService.findOne).toHaveBeenCalledWith(normalUser.id);
        });

        it('debería usar el userId del JWT, no un parámetro de ruta', async () => {
            const mockRequest = { user: { userId: 'id-admin' } };
            mockUsersService.findOne.mockResolvedValue(adminUser);

            await controller.getProfile(mockRequest);

            // Verificamos que se usa req.user.userId
            expect(mockUsersService.findOne).toHaveBeenCalledWith('id-admin');
        });

        it('debería propagar NotFoundException si el usuario del JWT ya no existe', async () => {
            const mockRequest = { user: { userId: 'id-eliminado' } };
            mockUsersService.findOne.mockRejectedValue(
                new NotFoundException('El usuario con ID id-eliminado no existe en JOIES'),
            );

            await expect(controller.getProfile(mockRequest))
                .rejects
                .toThrow(NotFoundException);
        });
    });

    // ──────────────────────────────────────────────
    // GET /users/:id
    // ──────────────────────────────────────────────
    describe('findOne', () => {
        it('debería retornar un usuario por su ID', async () => {
            mockUsersService.findOne.mockResolvedValue(normalUser);

            const result = await controller.findOne(normalUser.id);

            expect(result).toEqual(normalUser);
            expect(mockUsersService.findOne).toHaveBeenCalledWith(normalUser.id);
        });

        it('debería propagar NotFoundException si el ID no existe', async () => {
            mockUsersService.findOne.mockRejectedValue(
                new NotFoundException('El usuario con ID id-fantasma no existe en JOIES'),
            );

            await expect(controller.findOne('id-fantasma'))
                .rejects
                .toThrow(NotFoundException);
        });
    });

    // ──────────────────────────────────────────────
    // PATCH /users/:id
    // ──────────────────────────────────────────────
    describe('update', () => {
        it('debería actualizar un usuario y pasar el executorId del JWT', async () => {
            const mockRequest = { user: { userId: 'id-admin' } };
            const updateData = { name: 'Nuevo Nombre' };
            const updatedUser = new User({ ...normalUser, name: 'Nuevo Nombre' });

            mockUsersService.update.mockResolvedValue(updatedUser);

            const result = await controller.update(mockRequest, normalUser.id, updateData);

            expect(result.name).toBe('Nuevo Nombre');
            // Verificamos que el service recibe el executorId y el ID del target mergeado
            expect(mockUsersService.update).toHaveBeenCalledWith(
                'id-admin',
                { ...updateData, id: normalUser.id },
            );
        });

        it('debería permitir a un usuario editarse a sí mismo', async () => {
            const mockRequest = { user: { userId: normalUser.id } };
            const updateData = { name: 'Pepe Actualizado' };
            const updatedUser = new User({ ...normalUser, name: 'Pepe Actualizado' });

            mockUsersService.update.mockResolvedValue(updatedUser);

            const result = await controller.update(mockRequest, normalUser.id, updateData);

            expect(result.name).toBe('Pepe Actualizado');
            expect(mockUsersService.update).toHaveBeenCalledWith(
                normalUser.id,
                { ...updateData, id: normalUser.id },
            );
        });

        it('debería propagar UnauthorizedException si un no-admin intenta editar otro usuario', async () => {
            const mockRequest = { user: { userId: normalUser.id } };

            mockUsersService.update.mockRejectedValue(
                new UnauthorizedException('Permiso denegado: No puedes editar otro usuario'),
            );

            await expect(controller.update(mockRequest, 'id-otro', { name: 'Hack' }))
                .rejects
                .toThrow(UnauthorizedException);
        });

        it('debería propagar NotFoundException si el usuario a editar no existe', async () => {
            const mockRequest = { user: { userId: 'id-admin' } };

            mockUsersService.update.mockRejectedValue(
                new NotFoundException('El usuario con ID id-fantasma no existe en JOIES'),
            );

            await expect(controller.update(mockRequest, 'id-fantasma', { name: 'X' }))
                .rejects
                .toThrow(NotFoundException);
        });
    });

    // ──────────────────────────────────────────────
    // DELETE /users/:id
    // ──────────────────────────────────────────────
    describe('remove', () => {
        it('debería eliminar un usuario pasando el adminId del JWT', async () => {
            const mockRequest = { user: { userId: 'id-admin' } };
            mockUsersService.remove.mockResolvedValue(undefined);

            await controller.remove(mockRequest, normalUser.id);

            expect(mockUsersService.remove).toHaveBeenCalledWith('id-admin', normalUser.id);
        });

        it('debería propagar UnauthorizedException si un no-admin intenta borrar', async () => {
            const mockRequest = { user: { userId: normalUser.id } };

            mockUsersService.remove.mockRejectedValue(
                new UnauthorizedException('Permiso denegado: Solo los administradores pueden realizar esta acción'),
            );

            await expect(controller.remove(mockRequest, 'id-victima'))
                .rejects
                .toThrow(UnauthorizedException);
        });

        it('debería propagar NotFoundException si el usuario a borrar no existe', async () => {
            const mockRequest = { user: { userId: 'id-admin' } };

            mockUsersService.remove.mockRejectedValue(
                new NotFoundException('El usuario que intentas borrar no existe'),
            );

            await expect(controller.remove(mockRequest, 'id-fantasma'))
                .rejects
                .toThrow(NotFoundException);
        });
    });
});
