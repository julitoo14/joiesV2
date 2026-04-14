// El mapper se encarga de convertir de entidad a documento y viceversa
import { User } from '../domain/user.entity';
import { UserPersistence } from './user.schema';

export class UserMapper {
    // Cuando traemos datos de Mongo a nuestra App
    static toDomain(raw: any): User {
        return new User({
            id: raw._id.toString(), // Convertimos el ObjectId de Mongo a string
            name: raw.name,
            email: raw.email,
            password: raw.password,
            role: raw.role,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            lastActiveAt: raw.lastActiveAt,
            status: raw.status,
            botCount: raw.botCount,
            plan: raw.plan,
            binanceConfig: raw.binanceConfig,
            preferences: raw.preferences,
        });
    }

    // Cuando queremos guardar nuestra Entidad en Mongo
    static toPersistence(user: User): Partial<UserPersistence> {
        return {
            name: user.name,
            email: user.email,
            password: (user as any).password, // El hash
            role: user.role,
            lastActiveAt: user.lastActiveAt,
            status: user.status,
            botCount: user.botCount,
            plan: user.plan,
            binanceConfig: user.binanceConfig,
            preferences: user.preferences,
        };
    }
}