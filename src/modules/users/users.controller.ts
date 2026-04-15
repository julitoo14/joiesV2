import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './domain/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard) // Todas las rutas de usuarios requieren autenticación
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * GET /users
     * Devuelve todos los usuarios (tabla de Admin).
     */
    @Get()
    async findAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    /**
     * GET /users/me
     * Devuelve el perfil del usuario autenticado.
     * IMPORTANTE: Esta ruta va antes de :id para que no la interprete como un ID.
     */
    @Get('me')
    async getProfile(@Request() req: any): Promise<User> {
        return this.usersService.findOne(req.user.userId);
    }

    /**
     * GET /users/:id
     * Devuelve un usuario por su ID.
     */
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<User> {
        return this.usersService.findOne(id);
    }

    /**
     * PATCH /users/:id
     * Actualiza parcialmente un usuario.
     * El service se encarga de verificar permisos (solo admin o el propio usuario).
     */
    @Patch(':id')
    async update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateData: Partial<User>,
    ): Promise<User> {
        return this.usersService.update(req.user.userId, { ...updateData, id });
    }

    /**
     * DELETE /users/:id
     * Elimina un usuario. Solo admins pueden ejecutar esta acción (validado en el service).
     */
    @Delete(':id')
    async remove(
        @Request() req: any,
        @Param('id') id: string,
    ): Promise<void> {
        return this.usersService.remove(req.user.userId, id);
    }
}
