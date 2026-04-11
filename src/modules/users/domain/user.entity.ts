interface UserProps { // Interface para los datos que entran al constructor.
    id?: string;
    name: string;
    username: string;
    password?: string;
    role?: string;
    createdAt?: Date;
    updatedAt?: Date;
    lastActiveAt?: Date;
    tiendaNube?: {
        userId: string;
        accessToken: string;
    };
}

export class User {
    readonly id: string; // readonly para que no se pueda modificar
    public name: string;
    public username: string;
    private password: string; // private para que no se pueda modificar ni acceder desde fuera de la clase
    public role: string;
    readonly createdAt: Date; // readonly para que no se pueda modificar
    public updatedAt: Date;
    public lastActiveAt: Date;
    public tiendaNube?: {
        userId: string;
        accessToken: string;
    }

    constructor(props: UserProps) { // Recibe un objeto con las propiedades del usuario
        this.id = props.id || '';
        this.name = props.name || '';
        this.username = props.username || '';
        this.password = props.password || '';
        this.role = props.role || 'seller';
        this.createdAt = props.createdAt || new Date();
        this.updatedAt = props.updatedAt || new Date();
        this.lastActiveAt = props.lastActiveAt || new Date();
        this.tiendaNube = props.tiendaNube;
    }

    isLinkedToTiendaNube(): boolean {
        return !!this.tiendaNube?.accessToken && !!this.tiendaNube?.userId;
    }

    isAdmin(): boolean {
        return this.role === 'admin';
    }

    recordActivity(): void {
        this.lastActiveAt = new Date();
        this.updatedAt = new Date();
    }

    changePassword(password: string) { // Método para cambiar la contraseña
        if (!password) {
            throw new Error('Password is required');
        }
        this.password = password;
        this.updatedAt = new Date();
    }

    toJSON() { // Método para convertir el objeto a JSON, sin incluir el password
        return {
            id: this.id,
            name: this.name,
            username: this.username,
            role: this.role,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            tiendaNube: this.tiendaNube,
        };
    }
}