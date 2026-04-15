import { BaseBotExecutor } from './base-bot.executor';

export class GridBotExecutor extends BaseBotExecutor {
    // Acá iría el cliente del exchange, websockets, instancias para leer/escribir órdenes
    private simulatedInterval: NodeJS.Timeout;

    constructor(botId: string, pair: string, settings: any, status: 'RUNNING' | 'PAUSED' | 'STOPPED') {
        super(botId, pair, settings, status);
    }

    start(): void | Promise<void> {
        this.status = 'RUNNING';
        console.log(`[Bot ${this.botId} - GRID] Iniciado para el par ${this.pair}`);
        
        // Simulación: Inyectamos precios de prueba
        this.simulatedInterval = setInterval(() => {
            if (this.status === 'RUNNING') {
                const currentPrice = 60000 + (Math.random() * 1000 - 500); // Precio fake de BTC alrededor de 60k
                this.executeLogic(currentPrice);
            }
        }, 5000);
    }

    stop(): void | Promise<void> {
        this.status = 'STOPPED';
        console.log(`[Bot ${this.botId} - GRID] Apagado/Destruido.`);
        
        if (this.simulatedInterval) {
            clearInterval(this.simulatedInterval);
        }
    }

    executeLogic(price: number): void | Promise<void> {
        // En un caso real: Si estamos fuera del rango del grid, ignoramos, si cruzamos línea lanzamos orden.
        console.log(`[Bot ${this.botId} - GRID] Ejecutando lógica de grilla para el precio... [${price.toFixed(2)}]`);
    }
}
