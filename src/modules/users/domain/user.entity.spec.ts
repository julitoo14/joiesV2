import { User } from './user.entity';

describe('User Entity', () => {

    it('debería instanciarse con valores por defecto si el objeto es parcial', () => {
        const user = new User({ name: 'Julián', username: 'juli' });

        // se inicializa con valores por defecto
        expect(user.name).toBe('Julián');
        expect(user.username).toBe('juli');
        expect(user.role).toBe('seller');
        expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('debería validar si el usuario está vinculado a Tiendanube', () => {
        const user = new User({
            name: 'Julián',
            username: 'juli',
            tiendaNube: { userId: '7493645', accessToken: 'token123' }
        });

        expect(user.isLinkedToTiendaNube()).toBe(true); // verifica si el usuario tiene credenciales de Tiendanube
    });

    it('debería identificar correctamente el rol de admin', () => {
        const user = new User({ role: 'admin', name: 'Julián', username: 'juli' });
        expect(user.isAdmin()).toBe(true); // verifica si el usuario es admin

    });

    it('debería actualizar el password y la fecha de actualización', () => {
        const user = new User({ password: 'old-password', name: 'Julián', username: 'juli' });
        const oldUpdateDate = user.updatedAt;
        // guardamos la fecha previa al cambio

        user.changePassword('new-hashed-password');

        // Usamos (user as any) para poder leer la propiedad privada, ya que no es accesible desde fuera de la clase
        // y comparamos que la fecha de actualización sea mayor a la fecha previa al cambio
        expect((user as any).password).toBe('new-hashed-password');
        expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdateDate.getTime());
    });

    it('debería lanzar un error si se intenta cambiar el password por uno vacío', () => {
        const user = new User({ name: 'Julián', username: 'juli' });
        expect(() => user.changePassword('')).toThrow('Password is required');
    });

    it('debería excluir el password cuando se convierte a JSON', () => {
        const user = new User({ password: 'secret-password', name: 'Julián', username: 'juli' });
        const json = user.toJSON();

        expect(json).not.toHaveProperty('password');
        expect(json.name).toBe('Julián');
    });
});