import { User } from './user.entity';

describe('User Entity', () => {

    it('debería instanciarse con valores por defecto si el objeto es parcial', () => {
        const user = new User({ name: 'Julián', email: 'juli@example.com' });

        // se inicializa con valores por defecto
        expect(user.name).toBe('Julián');
        expect(user.email).toBe('juli@example.com');
        expect(user.role).toBe('seller');
        expect(user.status).toBe('active');
        expect(user.botCount).toBe(0);
        expect(user.plan).toBe('FREE');
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.preferences.currency).toBe('USD');
    });

    it('debería asignar correctamente los valores de configuración de Binance', () => {
        const user = new User({
            name: 'Julián',
            email: 'juli@example.com',
            binanceConfig: { apiKey: 'myKey', apiSecret: 'mySecret' }
        });

        expect(user.binanceConfig?.apiKey).toBe('myKey');
        expect(user.binanceConfig?.apiSecret).toBe('mySecret');
    });

    it('debería identificar correctamente el rol de admin', () => {
        const user = new User({ role: 'admin', name: 'Julián', email: 'juli@example.com' });
        expect(user.isAdmin()).toBe(true); // verifica si el usuario es admin

    });

    it('debería actualizar el password y la fecha de actualización', () => {
        const user = new User({ password: 'old-password', name: 'Julián', email: 'juli@example.com' });
        const oldUpdateDate = user.updatedAt;
        // guardamos la fecha previa al cambio

        user.changePassword('new-hashed-password');

        // Usamos (user as any) para poder leer la propiedad privada, ya que no es accesible desde fuera de la clase
        // y comparamos que la fecha de actualización sea mayor a la fecha previa al cambio
        expect((user as any).password).toBe('new-hashed-password');
        expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdateDate.getTime());
    });

    it('debería lanzar un error si se intenta cambiar el password por uno vacío', () => {
        const user = new User({ name: 'Julián', email: 'juli@example.com' });
        expect(() => user.changePassword('')).toThrow('Password is required');
    });

    it('debería excluir el password y apiSecret cuando se convierte a JSON', () => {
        const user = new User({
            password: 'secret-password',
            name: 'Julián',
            email: 'juli@example.com',
            binanceConfig: { apiKey: 'key123', apiSecret: 'secret123' }
        });
        const json = user.toJSON();

        expect(json).not.toHaveProperty('password');
        expect(json.binanceConfig).not.toHaveProperty('apiSecret');
        expect(json.binanceConfig?.apiKey).toBe('key123');
        expect(json.name).toBe('Julián');
        expect(json.email).toBe('juli@example.com');
    });
});