// El mapper se encarga de convertir de entidad a documento y viceversa
import { User } from '../domain/user.entity';
import { UserPersistence } from './user.schema';

export class UserMapper {
    // Cuando traemos datos de Mongo a nuestra App
    static toDomain(raw: any): User {
        return new User({
            id: raw._id.toString(), // Convertimos el ObjectId de Mongo a string
            name: raw.name,
            username: raw.username,
            password: raw.password,
            role: raw.role,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            lastActiveAt: raw.lastActiveAt,
            tiendaNube: raw.tiendaNube,
        });
    }

    // Cuando queremos guardar nuestra Entidad en Mongo
    static toPersistence(user: User): Partial<UserPersistence> {
        return {
            name: user.name,
            username: user.username,
            password: (user as any).password, // El hash
            role: user.role,
            lastActiveAt: user.lastActiveAt,
            tiendaNube: user.tiendaNube,
        };
    }
}