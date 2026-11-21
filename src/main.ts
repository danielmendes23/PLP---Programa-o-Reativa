import { monitorReadings } from './application/monitor.ts';
import { simulatedSensor$ } from './infrastructure/sensor-simulator.ts';
import { formatEvent } from './presentation/console-reporter.ts';

console.log('Monitor reativo — simulando leituras...');
monitorReadings(simulatedSensor$()).subscribe({
  next: event => console.log(formatEvent(event)),
  error: error => { console.error('Falha no fluxo:', error); process.exitCode = 1; },
  complete: () => console.log('Fim da simulação.')
});
