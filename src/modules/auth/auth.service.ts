import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Valida las credenciales del usuario.
     * Busca por email a través del UsersService y compara la contraseña con bcrypt.
     * Retorna el usuario (sin password) si es válido, o null si no.
     */
    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            return null;
        }

        // Accedemos al password privado via cast
        const storedPassword = (user as any).password;
        const isPasswordValid = await bcrypt.compare(pass, storedPassword);

        if (!isPasswordValid) {
            return null;
        }

        // Retornamos el usuario sin el password
        return user.toJSON();
    }

    /**
     * Genera un JWT para el usuario ya validado.
     * El payload contiene sub (id), email y role para autorización en otros módulos.
     */
    async login(user: any): Promise<{ access_token: string }> {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
