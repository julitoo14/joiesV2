import { User } from '../domain/user.entity';

export interface IUserRepository {
    // Sin importar la tecnología que usemos, solo definimos las operaciones que necesitamos si o si

    // Guarda o actualiza un usuario
    save(user: User): Promise<User>;

    // Búsquedas (devuelven nuestra Entidad, no el documento de Mongo)
    findOneById(id: string): Promise<User | null>;
    findOneByUsername(username: string): Promise<User | null>;

    // Para el listado de la administración de la fábrica
    findAll(): Promise<User[]>;

    // Actualiza el usuario
    update(user: User): Promise<User>;

    // Ejecutado por el admin
    delete(id: string): Promise<boolean>;
}