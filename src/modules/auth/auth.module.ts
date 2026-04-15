import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        UsersModule, // Importamos UsersModule para poder inyectar UsersService
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'gridbot-secret-dev',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService], // Exportamos por si otro módulo necesita validar tokens
})
export class AuthModule { }
