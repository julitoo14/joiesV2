import { GridBotExecutor } from './grid-bot.executor';
import * as ccxt from 'ccxt';

jest.mock('ccxt', () => {
    return {
        binance: jest.fn().mockImplementation(() => {
            return {
                fetchBalance: jest.fn().mockResolvedValue({ info: 'balance ok' }),
                fetchTicker: jest.fn().mockResolvedValue({ last: 60000 }),
            };
        }),
    };
});

describe('GridBotExecutor', () => {

    beforeEach(() => {
        jest.useFakeTimers(); // Interceptamos el reloj para probar el setInterval interno de la clase
        jest.spyOn(global.console, 'log').mockImplementation(() => {}); 
        jest.spyOn(global.console, 'warn').mockImplementation(() => {}); 
        jest.spyOn(global.console, 'error').mockImplementation(() => {}); 
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('debería cambiar el estado a RUNNING y destrabar el reloj (simulación) al llamar start()', async () => {
        const executor = new GridBotExecutor('bot-1', 'BTCUSDT', {}, undefined, 'STOPPED');
        const executeLogicSpy = jest.spyOn(executor, 'executeLogic');

        await executor.start();
        expect(executor.status).toBe('RUNNING');

        // Avanzamos el tiempo simulado en 5 segundos (lo que tarda el tick del bot)
        await jest.advanceTimersByTimeAsync(5000);

        expect(executeLogicSpy).toHaveBeenCalledTimes(1);
        executor.stop();
    });

    it('debería cortar la iteración al mandar stop()', async () => {
        const executor = new GridBotExecutor('bot-2', 'ETHUSDT', {}, undefined, 'STOPPED');
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

        await executor.start();
        expect(executor.status).toBe('RUNNING');

        executor.stop();
        expect(executor.status).toBe('STOPPED');
        
        // Verifica que se interrumpió el timer NodeJS
        expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('pause() marca el estado a PAUSED y omite cálculos sin romper flujo', async () => {
        const executor = new GridBotExecutor('bot-3', 'SOLUSDT', {}, undefined, 'STOPPED');
        const executeLogicSpy = jest.spyOn(executor, 'executeLogic');

        await executor.start();
        executor.pause(); // Pasa a PAUSED

        // Corremos el tiempo 5 segundos
        await jest.advanceTimersByTimeAsync(5000);

        // Como está PAUSED, executeLogic no debió arrojarse en el intervalo
        expect(executeLogicSpy).not.toHaveBeenCalled();
        executor.stop();
    });

    it('applySettings() mergea propiedades dinámicamente', () => {
        const executor = new GridBotExecutor('bot-4', 'XRPUSDT', { gridLines: 10 }, undefined, 'STOPPED');
        
        executor.applySettings({ gridLines: 20, breakEven: 50 });

        expect(executor.settings.gridLines).toBe(20);
        expect(executor.settings.breakEven).toBe(50);
    });

    it('should throw an Error and set STOPPED status if API keys are invalid', async () => {
        const MockBinance = (ccxt.binance as unknown as jest.Mock);
        
        // Hacemos que fetchBalance falle arrojando un error típico de autenticación de ccxt
        MockBinance.mockImplementationOnce(() => ({
            fetchBalance: jest.fn().mockRejectedValue(new Error('Invalid API-key, IP, or permissions for action.')),
            fetchTicker: jest.fn()
        }));

        const executor = new GridBotExecutor('bot-invalid', 'BTC/USDT', {}, { apiKey: 'bad', apiSecret: 'bad' }, 'STOPPED');

        await expect(executor.start()).rejects.toThrow('Credenciales de Binance inválidas: Invalid API-key, IP, or permissions for action.');
        
        expect(executor.status).toBe('STOPPED');
    });
});
