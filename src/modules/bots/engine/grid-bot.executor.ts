import { BaseBotExecutor } from './base-bot.executor';
import * as ccxt from 'ccxt';

export class GridBotExecutor extends BaseBotExecutor {
    private simulatedInterval: NodeJS.Timeout;
    private exchange: ccxt.binance;

    // Estado interno (se sincronizará con la DB)
    private gridLevels: number[] = [];
    private activeOrders: Map<number, { id: string, side: 'buy' | 'sell', price: number }> = new Map();
    private stats = { totalSales: 0, profitGross: 0, profitNet: 0 };

    constructor(
        botId: string,
        pair: string,
        settings: any,
        binanceConfig?: { apiKey: string; apiSecret: string },
        status: 'RUNNING' | 'PAUSED' | 'STOPPED' = 'STOPPED',
        onUpdate?: (state: any, stats: any) => Promise<void>
    ) {
        super(botId, pair, settings, binanceConfig, status, onUpdate);
    }

    /**
     * Inicializa el exchange CCXT (reutilizable para preview y start)
     */
    private initExchange(): ccxt.binance {
        if (!this.exchange) {
            this.exchange = new ccxt.binance({
                apiKey: this.binanceConfig?.apiKey,
                secret: this.binanceConfig?.apiSecret,
                enableRateLimit: true,
            });
        }
        return this.exchange;
    }

    /**
     * Preview: Calcula cuánto se necesita comprar antes de iniciar, sin ejecutar nada.
     * Devuelve info útil para mostrarle al usuario.
     */
    async previewStart(): Promise<{
        currentPrice: number;
        baseAsset: string;
        quoteAsset: string;
        existingBalance: number;
        requiredAmount: number;
        needsToBuy: number;
        estimatedCost: number;
        sellLevels: number;
        buyLevels: number;
    }> {
        const exchange = this.initExchange();
        await exchange.loadMarkets();

        const ticker = await exchange.fetchTicker(this.pair);
        const currentPrice = ticker?.last;
        if (currentPrice === undefined) {
            throw new Error('No se pudo obtener el precio actual de Binance.');
        }

        // Extraer base/quote del par (ej: BTC/USDT -> base=BTC, quote=USDT)
        const market = exchange.market(this.pair);
        const baseAsset = market.base;  // ej: BTC
        const quoteAsset = market.quote; // ej: USDT

        // Consultar balance actual del base asset
        const balance = await exchange.fetchBalance();
        const existingBalance = balance[baseAsset]?.free || 0;

        // Calcular niveles para saber cuántas ventas necesitamos
        this.calculateLevels();
        let sellLevels = 0;
        let buyLevels = 0;
        for (const level of this.gridLevels) {
            if (level > currentPrice) sellLevels++;
            else if (level < currentPrice) buyLevels++;
        }

        // Cantidad necesaria = capital para ventas / precio actual
        const capitalPerGrid = this.settings.capital / this.settings.gridLines;
        const requiredAmount = (capitalPerGrid * sellLevels) / currentPrice;

        // Lo que falta comprar = requerido - lo que ya tiene
        const needsToBuy = Math.max(0, requiredAmount - existingBalance);
        const estimatedCost = needsToBuy * currentPrice;

        return {
            currentPrice,
            baseAsset,
            quoteAsset,
            existingBalance,
            requiredAmount,
            needsToBuy,
            estimatedCost,
            sellLevels,
            buyLevels,
        };
    }

    async start(): Promise<void> {
        this.status = 'RUNNING';
        console.log(`[Bot ${this.botId}] Iniciando Grid Engine (Neutral)...`);

        const exchange = this.initExchange();

        try {
            await exchange.loadMarkets();
            const ticker = await exchange.fetchTicker(this.pair);
            const currentPrice = ticker?.last;

            if (currentPrice === undefined) {
                throw new Error('No se pudo obtener el precio actual de Binance.');
            }

            const market = exchange.market(this.pair);
            const baseAsset = market.base;

            // 1. Calcular niveles de la grilla
            this.calculateLevels();

            // 2. Limpiar órdenes previas de este bot
            await this.cancelAllBotOrders();

            // 3. Verificar balance existente del base asset
            const balance = await exchange.fetchBalance();
            const existingBalance = balance[baseAsset]?.free || 0;

            // Calcular cuánto necesitamos para las órdenes de venta
            const capitalPerGrid = this.settings.capital / this.settings.gridLines;
            let sellLevels = 0;
            for (const level of this.gridLevels) {
                if (level > currentPrice) sellLevels++;
            }
            const requiredAmount = (capitalPerGrid * sellLevels) / currentPrice;
            const needsToBuy = Math.max(0, requiredAmount - existingBalance);

            // 4. Solo comprar lo que falte
            if (needsToBuy > 0) {
                const preciseAmount = Number(exchange.amountToPrecision(this.pair, needsToBuy));
                if (preciseAmount > 0) {
                    console.log(`[Bot ${this.botId}] Balance existente: ${existingBalance.toFixed(6)} ${baseAsset}. Necesita: ${requiredAmount.toFixed(6)}. Comprando ${needsToBuy.toFixed(6)}...`);
                    await exchange.createMarketBuyOrder(this.pair, preciseAmount);
                }
            } else {
                console.log(`[Bot ${this.botId}] Balance suficiente (${existingBalance.toFixed(6)} ${baseAsset}). No se necesita compra inicial.`);
            }

            // 5. Colocar órdenes LIMIT iniciales
            for (let i = 0; i < this.gridLevels.length; i++) {
                const levelPrice = this.gridLevels[i];
                if (levelPrice < currentPrice) {
                    await this.placeOrder(i, 'buy');
                } else if (levelPrice > currentPrice) {
                    await this.placeOrder(i, 'sell');
                }
            }

            console.log(`[Bot ${this.botId}] Grilla desplegada con éxito. ${this.activeOrders.size} órdenes activas.`);

        } catch (error) {
            console.error(`[Bot ${this.botId}] Error crítico al iniciar:`, error.message);
            this.status = 'STOPPED';
            throw error;
        }

        // 6. Loop de monitoreo (5 segundos)
        this.simulatedInterval = setInterval(() => {
            if (this.status === 'RUNNING') {
                this.monitorOrders();
            }
        }, 5000);
    }

    private calculateLevels() {
        const { lowerPrice, upperPrice, gridLines } = this.settings;
        const step = (upperPrice - lowerPrice) / (gridLines - 1);
        this.gridLevels = [];
        for (let i = 0; i < gridLines; i++) {
            this.gridLevels.push(Number((lowerPrice + i * step).toFixed(8)));
        }
    }

    private async placeOrder(index: number, side: 'buy' | 'sell') {
        const price = this.gridLevels[index];
        const capitalPerGrid = this.settings.capital / this.settings.gridLines;
        const amount = capitalPerGrid / price;

        try {
            const order = await this.exchange.createOrder(
                this.pair,
                'limit',
                side,
                Number(this.exchange.amountToPrecision(this.pair, amount)),
                Number(this.exchange.priceToPrecision(this.pair, price)),
                { clientOrderId: `joies_${this.botId.substring(0, 6)}_${index}_${side === 'buy' ? 'b' : 's'}` }
            );
            this.activeOrders.set(index, { id: order.id, side, price });
        } catch (e) {
            console.error(`[Bot ${this.botId}] Error colocando ${side} en level ${index}:`, e.message);
        }
    }

    private async monitorOrders() {
        try {
            const openOrders = await this.exchange.fetchOpenOrders(this.pair);
            const openOrderIds = new Set(openOrders.map(o => o.id));

            for (const [index, active] of this.activeOrders.entries()) {
                if (!openOrderIds.has(active.id)) {
                    // La orden ya no está abierta -> SE EJECUTÓ (o se canceló manualmente)
                    console.log(`[Bot ${this.botId}] ¡Orden detectada ejecutada! Level ${index} (${active.side})`);

                    if (active.side === 'buy') {
                        // Se compró -> Toca poner venta arriba
                        this.activeOrders.delete(index);
                        if (index + 1 < this.gridLevels.length) {
                            await this.placeOrder(index + 1, 'sell');
                        }
                    } else {
                        // Se vendió -> Toca poner compra abajo + Calcular Profit
                        this.stats.totalSales++;
                        const buyPrice = this.gridLevels[index - 1]; // El buy previo
                        const sellPrice = active.price;
                        const profit = (sellPrice - buyPrice) * ((this.settings.capital / this.settings.gridLines) / sellPrice);

                        this.stats.profitGross += profit;
                        this.stats.profitNet += profit * 0.998; // Descuento de comisiones aprox (0.2%)

                        this.activeOrders.delete(index);
                        if (index - 1 >= 0) {
                            await this.placeOrder(index - 1, 'buy');
                        }
                    }

                    // Persistimos el estado y estadísticas en la DB
                    if (this.onUpdate) {
                        await this.onUpdate(
                            {
                                gridLevels: this.gridLevels,
                                activeOrders: Object.fromEntries(this.activeOrders)
                            },
                            this.stats
                        );
                    }
                    console.log(`[Bot ${this.botId}] Stats actualizadas y persistidas: Sales: ${this.stats.totalSales}, Profit: $${this.stats.profitNet.toFixed(4)}`);
                }
            }
        } catch (e) {
            console.error(`[Bot ${this.botId}] Error en monitoreo:`, e.message);
        }
    }

    private async cancelAllBotOrders() {
        try {
            const openOrders = await this.exchange.fetchOpenOrders(this.pair);
            for (const o of openOrders) {
                if (o.clientOrderId && o.clientOrderId.startsWith(`joies_${this.botId.substring(0, 6)}`)) {
                    await this.exchange.cancelOrder(o.id, this.pair);
                }
            }
        } catch (e) { }
    }

    async stop(): Promise<void> {
        this.status = 'STOPPED';
        if (this.simulatedInterval) clearInterval(this.simulatedInterval);
        console.log(`[Bot ${this.botId}] Motor detenido. Cancelando órdenes...`);
        await this.cancelAllBotOrders();
    }

    executeLogic(price: number): void | Promise<void> {
        // La lógica ahora se maneja dentro de monitorOrders por polling
    }
}
