export abstract class BaseBotExecutor {
    public botId: string;
    public pair: string;
    public status: 'RUNNING' | 'PAUSED' | 'STOPPED';
    public settings: any;
    public binanceConfig?: { apiKey: string; apiSecret: string };
    protected onUpdate?: (state: any, stats: any) => Promise<void>;

    constructor(
        botId: string, 
        pair: string, 
        settings: any, 
        binanceConfig?: { apiKey: string; apiSecret: string }, 
        initialStatus: 'RUNNING' | 'PAUSED' | 'STOPPED' = 'STOPPED',
        onUpdate?: (state: any, stats: any) => Promise<void>
    ) {
        this.botId = botId;
        this.pair = pair;
        this.settings = settings;
        this.binanceConfig = binanceConfig;
        this.status = initialStatus;
        this.onUpdate = onUpdate;
    }

    /**
     * Inicia los subprocesos del bot (ej. conectar a websocket)
     */
    abstract start(): void | Promise<void>;

    /**
     * Detiene los subprocesos y limpia memoria (ej. desconectar websockets)
     */
    abstract stop(): void | Promise<void>;

    /**
     * Método principal donde ocurre la toma de decisión
     */
    abstract executeLogic(price: number): void | Promise<void>;

    /**
     * Pausa el bot (no evalúa operaciones pero se mantiene vivo en memoria)
     */
    public pause(): void {
        if (this.status !== 'RUNNING') {
            console.warn(`[Bot ${this.botId}] Intento de pausa ignorado, el estado actual es ${this.status}`);
            return;
        }
        this.status = 'PAUSED';
        console.log(`[Bot ${this.botId}] Pausado.`);
    }

    /**
     * Reanuda la ejecución del bot
     */
    public resume(): void {
        if (this.status !== 'PAUSED') {
            console.warn(`[Bot ${this.botId}] Intento de reanudación ignorado, el estado actual es ${this.status}`);
            return;
        }
        this.status = 'RUNNING';
        console.log(`[Bot ${this.botId}] Reanudado.`);
    }

    /**
     * Permite inyectarle un nuevo set de configuración en caliente (Ej: actualizar upper/lower borders de la grid)
     */
    public applySettings(newSettings: any): void {
        this.settings = { ...this.settings, ...newSettings };
        console.log(`[Bot ${this.botId}] Nuevas settings aplicadas en caliente.`);
    }
}
