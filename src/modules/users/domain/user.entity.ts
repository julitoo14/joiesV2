interface UserProps { // Interface para los datos que entran al constructor.
    id?: string;
    name: string;
    email: string;
    password?: string;
    role?: string;
    createdAt?: Date;
    updatedAt?: Date;
    lastActiveAt?: Date;
    status?: 'active' | 'inactive' | 'suspended';
    botCount?: number;
    plan?: 'FREE' | 'PRO' | 'UNLIMITED';
    binanceConfig?: {
        apiKey: string;
        apiSecret: string;
    };
    preferences?: {
        currency?: string;
        theme?: string;
        alertsEnabled?: boolean;
    };
}

export class User {
    readonly id: string; // readonly para que no se pueda modificar
    public name: string;
    public email: string;
    private password: string; // private para que no se pueda modificar ni acceder desde fuera de la clase
    public role: string;
    readonly createdAt: Date; // readonly para que no se pueda modificar
    public updatedAt: Date;
    public lastActiveAt: Date;
    public status: 'active' | 'inactive' | 'suspended';
    public botCount: number;
    public plan: 'FREE' | 'PRO' | 'UNLIMITED';
    public binanceConfig?: {
        apiKey: string;
        apiSecret: string;
    };
    public preferences: {
        currency?: string;
        theme?: string;
        alertsEnabled?: boolean;
    };

    constructor(props: UserProps) { // Recibe un objeto con las propiedades del usuario
        this.id = props.id || '';
        this.name = props.name || '';
        this.email = props.email || '';
        this.password = props.password || '';
        this.role = props.role || 'seller';
        this.createdAt = props.createdAt || new Date();
        this.updatedAt = props.updatedAt || new Date();
        this.lastActiveAt = props.lastActiveAt || new Date();
        this.status = props.status || 'active';
        this.botCount = props.botCount || 0;
        this.plan = props.plan || 'FREE';
        this.binanceConfig = props.binanceConfig;
        this.preferences = props.preferences || { currency: 'USD', theme: 'light', alertsEnabled: true };
    }

    isAdmin(): boolean {
        return this.role === 'admin';
    }

    changePassword(password: string) { // Método para cambiar la contraseña
        if (!password) {
            throw new Error('Password is required');
        }
        this.password = password;
        this.updatedAt = new Date();
    }

    toJSON() { // Método para convertir el objeto a JSON, sin incluir el password ni apiSecret
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            status: this.status,
            botCount: this.botCount,
            plan: this.plan,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastActiveAt: this.lastActiveAt,
            binanceConfig: this.binanceConfig ? { apiKey: this.binanceConfig.apiKey } : undefined,
            preferences: this.preferences,
        };
    }
}