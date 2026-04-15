import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * POST /auth/login
     * Body: { email: string, password: string }
     *
     * El LocalAuthGuard intercepta el request, ejecuta LocalStrategy.validate(),
     * y si es exitoso, inyecta el usuario validado en req.user.
     */
    @Post('login')
    @UseGuards(LocalAuthGuard)
    async login(@Request() req: any) {
        // req.user viene del resultado de LocalStrategy.validate()
        return this.authService.login(req.user);
    }

    /**
     * POST /auth/register
     * Body: { name: string, email: string, password: string }
     */
    @Post('register')
    async register(@Body() userData: any) {
        return this.authService.register(userData);
    }
}
