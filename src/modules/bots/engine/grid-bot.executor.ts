import { BaseBotExecutor } from './base-bot.executor';
import * as ccxt from 'ccxt';

export class GridBotExecutor extends BaseBotExecutor {
    // Cliente del exchange para leer/escribir órdenes
    private simulatedInterval: NodeJS.Timeout;
    private exchange: ccxt.binance;

    constructor(
        botId: string,
        pair: string,
        settings: any,
        binanceConfig?: { apiKey: string; apiSecret: string },
        status: 'RUNNING' | 'PAUSED' | 'STOPPED' = 'STOPPED'
    ) {
        super(botId, pair, settings, binanceConfig, status);
    }

    async start(): Promise<void> {
        this.status = 'RUNNING';
        console.log(`[Bot ${this.botId} - GRID] Iniciado para el par ${this.pair}`);

        // Inicializar cliente CCXT para Producción
        this.exchange = new ccxt.binance({
            apiKey: this.binanceConfig?.apiKey || 'API_KEY_MOCK',
            secret: this.binanceConfig?.apiSecret || 'API_SECRET_MOCK',
            enableRateLimit: true,
        });

        // Verificamos si las llaves de la API son correctas consultando el balance
        try {
            await this.exchange.fetchBalance();
            console.log(`[Bot ${this.botId} - GRID] Autenticación con Binance exitosa.`);
        } catch (error) {
            console.error(`[Bot ${this.botId} - GRID] Error de autenticación en Binance:`, error.message);
            this.status = 'STOPPED';
            throw new Error(`Credenciales de Binance inválidas: ${error.message}`);
        }

        // Verificación visual/Mock loop: Invocamos API real en Producción (fetchTicker no requiere llaves, pero el client ya está auth)
        this.simulatedInterval = setInterval(async () => {
            if (this.status === 'RUNNING') {
                try {
                    const ticker = await this.exchange.fetchTicker(this.pair);
                    const currentPrice = ticker.last;
                    console.log(currentPrice);
                    if (currentPrice !== undefined) {
                        this.executeLogic(currentPrice);
                    }
                } catch (error) {
                    console.error(`[Bot ${this.botId} - GRID] Error fetch ticker:`, error.message);
                }
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
