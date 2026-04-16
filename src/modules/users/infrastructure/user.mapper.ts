// El mapper se encarga de convertir de entidad a documento y viceversa
import { User } from '../domain/user.entity';
import { UserPersistence } from './user.schema';
import { encryptString, decryptString } from './crypto.util';

export class UserMapper {
    // Cuando traemos datos de Mongo a nuestra App
    static toDomain(raw: any): User {
        let binanceConfig = raw.binanceConfig;
        if (binanceConfig && binanceConfig.apiSecret) {
            binanceConfig = { ...binanceConfig, apiSecret: decryptString(binanceConfig.apiSecret) };
        }

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
            binanceConfig: binanceConfig,
            preferences: raw.preferences,
        });
    }

    // Cuando queremos guardar nuestra Entidad en Mongo
    static toPersistence(user: User): Partial<UserPersistence> {
        let binanceConfig = user.binanceConfig;
        if (binanceConfig && binanceConfig.apiSecret) {
            binanceConfig = { ...binanceConfig, apiSecret: encryptString(binanceConfig.apiSecret) };
        }

        return {
            name: user.name,
            email: user.email,
            password: (user as any).password, // El hash
            role: user.role,
            lastActiveAt: user.lastActiveAt,
            status: user.status,
            botCount: user.botCount,
            plan: user.plan,
            binanceConfig: binanceConfig,
            preferences: user.preferences,
        };
    }
}