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
        findOneByEmail: jest.fn(),
        emailExists: jest.fn(),
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
        const normalUser = new User({ id: 'id-pepe', name: 'Pepe', email: 'pepe@pepe.com', role: 'user' });
        mockUserRepository.findOneById.mockResolvedValue(normalUser);

        // 2. Intentamos borrar y esperamos que falle
        await expect(service.remove('id-pepe', 'id-victima'))
            .rejects
            .toThrow(UnauthorizedException);
    });

    it('debería llamar al repositorio si el que borra es Admin', async () => {
        // 1. Seteamos un Admin
        const adminUser = new User({ id: 'id-admin', name: 'Julian', email: 'admin@pepe.com', role: 'admin' });
        mockUserRepository.findOneById.mockResolvedValue(adminUser);
        mockUserRepository.delete.mockResolvedValue(true);

        // 2. Ejecutamos
        await service.remove('id-admin', 'id-victima');

        // 3. Verificamos que el repo realmente fue llamado
        expect(mockUserRepository.delete).toHaveBeenCalledWith('id-victima');
    });

    it('debería actualizar la fecha de acceso y guardar el usuario', async () => {
        const user = new User({ id: 'id-test', name: 'Test', email: 'test@pepe.com', role: 'user' });
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
        const adminUser = new User({ id: 'id-admin', name: 'Admin', email: 'admin@test.com', role: 'admin' });
        const targetUser = new User({ id: 'id-target', name: 'Old Name', email: 'target@test.com', role: 'user' });

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
        const user = new User({ id: 'id-self', name: 'Self', email: 'self@test.com', role: 'user' });

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
        const normalUser = new User({ id: 'id-pepe', name: 'Pepe', email: 'pepe@test.com', role: 'user' });
        const victimUser = new User({ id: 'id-victima', name: 'Victima', email: 'victima@test.com', role: 'user' });

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
        const normalUser = new User({ id: 'id-pepe', name: 'Pepe', email: 'pepe@test.com', role: 'user' });

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
        const normalUser = new User({ id: 'id-pepe', name: 'Pepe', email: 'pepe@test.com', role: 'user' });

        mockUserRepository.findOneById.mockImplementation((id: string) => {
            if (id === normalUser.id) return Promise.resolve(normalUser);
            return Promise.resolve(null);
        });

        await expect(service.update('id-inexistente', {
            id: normalUser.id,
            name: 'Changed Name'
        }))
            .rejects
            .toThrow(NotFoundException);
    });

    it('deberia devolver true si el email existe', async () => {
        const user = new User({ id: 'id-test', name: 'Test', email: 'test@pepe.com', role: 'user' });
        mockUserRepository.findOneByEmail.mockResolvedValue(user);
        mockUserRepository.emailExists.mockResolvedValue(true);

        const result = await service.emailExists('test@pepe.com');

        expect(result).toBe(true);
    });

    it('deberia devolver false si el email no existe', async () => {
        const user = new User({ id: 'id-test', name: 'Test', email: 'test@pepe.com', role: 'user' });
        mockUserRepository.findOneByEmail.mockResolvedValue(user);
        mockUserRepository.emailExists.mockResolvedValue(false);

        const result = await service.emailExists('test@pepe.com');

        expect(result).toBe(false);
    });

    it('deberia devolver el usuario si el email existe', async () => {
        const user = new User({ id: 'id-test', name: 'Test', email: 'test@pepe.com', role: 'user' });
        mockUserRepository.findOneByEmail.mockResolvedValue(user);

        const result = await service.findOneByEmail('test@pepe.com');

        expect(result).toBe(user);
    });

    it('deberia devolver null si el email no existe', async () => {
        const user = new User({ id: 'id-test', name: 'Test', email: 'test@pepe.com', role: 'user' });
        mockUserRepository.findOneByEmail.mockResolvedValue(user);
        mockUserRepository.findOneByEmail.mockResolvedValue(null);

        const result = await service.findOneByEmail('test@pepe.com');

        expect(result).toBe(null);
    });

    describe('create', () => {
        it('debería arrojar error de Autorización si el email ya existe', async () => {
            const user = new User({ id: 'dummy', name: 'Dupe', email: 'pepe@pepe.com', role: 'user' });
            mockUserRepository.findOneByEmail.mockResolvedValue(user);

            await expect(service.create({ email: 'pepe@pepe.com', name: 'Nuevo' }))
                .rejects
                .toThrow(UnauthorizedException);
        });

        it('debería instanciar un User con DDD constructor y guardarlo exitosamente', async () => {
            mockUserRepository.findOneByEmail.mockResolvedValue(null); // Correo libre
            
            // Simular respuesta del repo (el usuario guardado con ID asignado)
            const createdUser = new User({ id: '123', email: 'nuevo@joies.com', name: 'Valid', role: 'user' });
            mockUserRepository.save.mockResolvedValue(createdUser);

            const result = await service.create({ email: 'nuevo@joies.com', name: 'Valid' });

            // Verifica que devolvió la promesa sana del repo
            expect(result.id).toBe('123');
            
            // Verifica que llamó a guardar con las propiedades correctas aislando fuga de mocks previos
            expect(mockUserRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ email: 'nuevo@joies.com', name: 'Valid' })
            );
        });
    });
});