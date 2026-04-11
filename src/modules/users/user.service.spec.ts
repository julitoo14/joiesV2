import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { User } from './domain/user.entity';

describe('UsersService', () => {
    let service: UsersService;

    // Creamos un Mock del repositorio
    const mockUserRepository = {
        findOneById: jest.fn(),
        delete: jest.fn(),
        save: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: 'IUserRepository',
                    useValue: mockUserRepository, // Le paso el mock en vez del real
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('debería lanzar UnauthorizedException si un no-admin intenta borrar', async () => {
        // 1. Seteamos los datos: un usuario que NO es admin
        const normalUser = new User({ id: 'id-pepe', name: 'Pepe', username: 'pepe', role: 'seller' });
        mockUserRepository.findOneById.mockResolvedValue(normalUser);

        // 2. Intentamos borrar y esperamos que falle
        await expect(service.remove('id-pepe', 'id-victima'))
            .rejects
            .toThrow(UnauthorizedException);
    });

    it('debería llamar al repositorio si el que borra es Admin', async () => {
        // 1. Seteamos un Admin
        const adminUser = new User({ id: 'id-admin', name: 'Julian', username: 'admin', role: 'admin' });
        mockUserRepository.findOneById.mockResolvedValue(adminUser);
        mockUserRepository.delete.mockResolvedValue(true);

        // 2. Ejecutamos
        await service.remove('id-admin', 'id-victima');

        // 3. Verificamos que el repo realmente fue llamado
        expect(mockUserRepository.delete).toHaveBeenCalledWith('id-victima');
    });

    it('debería actualizar la fecha de acceso y guardar el usuario', async () => {
        const user = new User({ id: 'id-test', name: 'Test', username: 'test', role: 'seller' });
        mockUserRepository.findOneById.mockResolvedValue(user);
        mockUserRepository.save.mockResolvedValue(user);

        await service.updateActivity('id-test');

        expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it('debería lanzar NotFoundException si el usuario no existe al actualizar', async () => {
        mockUserRepository.findOneById.mockResolvedValue(null);

        await expect(service.updateActivity('id-inexistente'))
            .rejects
            .toThrow(NotFoundException);
    });

    it('debería permitir a un admin editar cualquier campo de otro usuario', async () => {
        const adminUser = new User({ id: 'id-admin', name: 'Admin', username: 'admin', role: 'admin' });
        const targetUser = new User({ id: 'id-target', name: 'Old Name', username: 'target', role: 'seller' });

        // Mockeamos que encontramos al usuario a editar o al de ejecución
        mockUserRepository.findOneById.mockImplementation((id: string) => {
            if (id === targetUser.id) return Promise.resolve(targetUser);
            if (id === adminUser.id) return Promise.resolve(adminUser);
            return Promise.resolve(null);
        });
        // Mockeamos que el guardado funciona y devolvemos el usuario modificado
        mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

        // Intentamos cambiarle el nombre y el rol
        const updatedUser = await service.update(adminUser.id, {
            id: targetUser.id,
            name: 'New Name',
            role: 'admin'
        });

        // Verificamos que el cambio se aplicó
        expect(updatedUser.name).toBe('New Name');
        expect(updatedUser.role).toBe('admin');
        expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('debería permitir a un usuario editar solo su propio perfil', async () => {
        const user = new User({ id: 'id-self', name: 'Self', username: 'self', role: 'seller' });

        // Mockeamos que encontramos al usuario
        mockUserRepository.findOneById.mockResolvedValue(user);
        mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

        // Intentamos cambiar solo su nombre
        const updatedUser = await service.update(user.id, {
            id: user.id,
            name: 'Self Updated'
        });

        expect(updatedUser.name).toBe('Self Updated');
        expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar UnauthorizedException si un no-admin intenta editar otro usuario', async () => {
        const normalUser = new User({ id: 'id-pepe', name: 'Pepe', username: 'pepe', role: 'seller' });
        const victimUser = new User({ id: 'id-victima', name: 'Victima', username: 'victima', role: 'seller' });

        // Mockeamos que encontramos al usuario a editar
        mockUserRepository.findOneById.mockImplementation((id: string) => {
            if (id === victimUser.id) return Promise.resolve(victimUser);
            if (id === normalUser.id) return Promise.resolve(normalUser);
            return Promise.resolve(null);
        });

        // Intentamos editar a la víctima siendo un usuario normal
        await expect(service.update(normalUser.id, {
            id: victimUser.id,
            name: 'Changed Name'
        }))
            .rejects
            .toThrow(UnauthorizedException);
    });

    it('debería lanzar NotFoundException si el usuario a editar no existe', async () => {
        const normalUser = new User({ id: 'id-pepe', name: 'Pepe', username: 'pepe', role: 'seller' });

        mockUserRepository.findOneById.mockImplementation((id: string) => {
            if (id === normalUser.id) return Promise.resolve(normalUser);
            return Promise.resolve(null);
        });

        await expect(service.update(normalUser.id, {
            id: 'id-inexistente',
            name: 'Changed Name'
        }))
            .rejects
            .toThrow(NotFoundException);
    });

    it('debería lanzar NotFoundException si el usuario que ejecuta la acción no existe', async () => {
        const normalUser = new User({ id: 'id-pepe', name: 'Pepe', username: 'pepe', role: 'seller' });

        mockUserRepository.findOneById.mockImplementation((id: string) => {
            if (id === normalUser.id) return Promise.resolve(normalUser);
            return Promise.resolve(null);
        });

        await expect(service.update(normalUser.id, {
            id: normalUser.id,
            name: 'Changed Name'
        }))
            .rejects
            .toThrow(NotFoundException);
    });

});