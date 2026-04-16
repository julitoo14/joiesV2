import { Injectable, Logger } from '@nestjs/common';
import * as ccxt from 'ccxt';

@Injectable()
export class MarketDataService {
    private readonly logger = new Logger(MarketDataService.name);
    private readonly binance = new ccxt.binance({ enableRateLimit: true });

    async getTicker(symbol: string) {
        try {
            const ticker = await this.binance.fetchTicker(symbol);
            return {
                symbol: ticker.symbol,
                last: ticker.last,
                high: ticker.high,
                low: ticker.low,
                bid: ticker.bid,
                ask: ticker.ask,
            };
        } catch (error) {
            this.logger.error(`Error fetching ticker for ${symbol}: ${error.message}`);
            throw error;
        }
    }
}
