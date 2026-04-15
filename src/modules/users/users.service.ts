import { Injectable, Inject, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { IUserRepository } from './repositories/user-repository.interface';
import { User } from './domain/user.entity';

@Injectable()
export class UsersService {
    constructor(
        // Inyectamos la Interfaz, no la clase de Mongo, para mantenerlo desacoplado
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    ) { }

    // 1. Buscar todos los usuarios (Solo para la tabla de Admin de la fábrica)
    async findAll(): Promise<User[]> {
        return this.userRepository.findAll();
    }

    // 2. Buscar un usuario por ID (Útil para perfiles o edición)
    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOneById(id);
        if (!user) {
            throw new NotFoundException(`El usuario con ID ${id} no existe en JOIES`);
        }
        return user;
    }

    // 3. El método de borrado con la lógica que querías
    async remove(adminId: string, targetId: string): Promise<void> {
        // Primero buscamos al que quiere borrar (el ejecutor)
        const admin = await this.findOne(adminId);

        // Verificamos si es realmente un Admin usando el método de nuestra Entidad
        if (!admin.isAdmin()) {
            throw new UnauthorizedException('Permiso denegado: Solo los administradores pueden realizar esta acción');
        }

        // Si es admin, procedemos al borrado
        const deleted = await this.userRepository.delete(targetId);
        if (!deleted) {
            throw new NotFoundException('El usuario que intentas borrar no existe');
        }
    }

    // 4. Actualizar el último acceso (Podés llamarlo desde un middleware de sesión)
    async updateActivity(userId: string): Promise<void> {
        const user = await this.findOne(userId);
        user.recordActivity(); // Usamos el método que agregamos a la Entidad
        await this.userRepository.save(user);
    }

    async emailExists(email: string): Promise<boolean> {
        return this.userRepository.emailExists(email);
    }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOneByEmail(email);
    }

    async update(executorId: string, updateData: Partial<User>): Promise<User> {
        // 1. Buscamos el usuario destino (el que va a recibir los cambios)
        const targetId = updateData.id;
        if (!targetId) {
            throw new NotFoundException('Se requiere el ID del usuario a editar');
        }
        const targetUser = await this.findOne(targetId);

        // 2. Buscamos al usuario que ejecuta la acción
        const executorUser = executorId === targetId ? targetUser : await this.findOne(executorId);

        // 3. Verificación de seguridad: ¿Quién está intentando editar?
        if (executorUser.id !== targetUser.id && !executorUser.isAdmin()) {
            throw new UnauthorizedException('Permiso denegado: No puedes editar otro usuario');
        }

        // 4. Aplicamos los cambios al objeto destino (evitando sobreescribir el ID principal)
        const updates = { ...updateData };
        delete updates.id;
        Object.assign(targetUser, updates);

        // 5. Guardamos el resultado en la base de datos
        return this.userRepository.save(targetUser);
    }
}