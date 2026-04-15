import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        // Indicamos que el campo de "username" en el body es "email"
        super({ usernameField: 'email' });
    }

    /**
     * Passport llama a este método automáticamente con las credenciales del body.
     * Si retorna null, Passport lanza 401 automáticamente.
     */
    async validate(email: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }
        return user; // Esto queda disponible en req.user
    }
}
