import { GridBotExecutor } from './grid-bot.executor';

describe('GridBotExecutor', () => {

    beforeEach(() => {
        jest.useFakeTimers(); // Interceptamos el reloj para probar el setInterval interno de la clase
        jest.spyOn(global.console, 'log').mockImplementation(() => {}); 
        jest.spyOn(global.console, 'warn').mockImplementation(() => {}); 
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('debería cambiar el estado a RUNNING y destrabar el reloj (simulación) al llamar start()', () => {
        const executor = new GridBotExecutor('bot-1', 'BTCUSDT', {}, 'STOPPED');
        const executeLogicSpy = jest.spyOn(executor, 'executeLogic');

        executor.start();
        expect(executor.status).toBe('RUNNING');

        // Avanzamos el tiempo simulado en 5 segundos (lo que tarda el tick del bot)
        jest.advanceTimersByTime(5000);

        expect(executeLogicSpy).toHaveBeenCalledTimes(1);
    });

    it('debería cortar la iteración al mandar stop()', () => {
        const executor = new GridBotExecutor('bot-2', 'ETHUSDT', {}, 'STOPPED');
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

        executor.start();
        expect(executor.status).toBe('RUNNING');

        executor.stop();
        expect(executor.status).toBe('STOPPED');
        
        // Verifica que se interrumpió el timer NodeJS
        expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('pause() marca el estado a PAUSED y omite cálculos sin romper flujo', () => {
        const executor = new GridBotExecutor('bot-3', 'SOLUSDT', {}, 'STOPPED');
        const executeLogicSpy = jest.spyOn(executor, 'executeLogic');

        executor.start();
        executor.pause(); // Pasa a PAUSED

        // Corremos el tiempo 5 segundos
        jest.advanceTimersByTime(5000);

        // Como está PAUSED, executeLogic no debió arrojarse en el intervalo
        expect(executeLogicSpy).not.toHaveBeenCalled();
    });

    it('applySettings() mergea propiedades dinámicamente', () => {
        const executor = new GridBotExecutor('bot-4', 'XRPUSDT', { gridLines: 10 }, 'STOPPED');
        
        executor.applySettings({ gridLines: 20, breakEven: 50 });

        expect(executor.settings.gridLines).toBe(20);
        expect(executor.settings.breakEven).toBe(50);
    });
});
