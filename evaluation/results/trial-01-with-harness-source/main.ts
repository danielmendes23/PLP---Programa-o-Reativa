import { from } from 'rxjs';
import { makeDemoReadings } from './infrastructure/sensor-simulator.ts';
import { monitorReadings } from './application/monitor.ts';
import { formatEvent } from './presentation/formatter.ts';

const readings = makeDemoReadings();
const readings$ = from(readings);

console.log('=== Monitor de Temperatura - Demonstração ===');
console.log(`Leituras geradas (${readings.length}):`);
readings.forEach((r, i) => {
  const time = new Date(r.timestamp).toISOString();
  console.log(`  [${i + 1}] ${time} | sensor=${r.sensorId} | temp=${r.temperature}°C`);
});
console.log('\nEventos emitidos:');

monitorReadings(readings$).subscribe({
  next: (event) => console.log(' ', formatEvent(event)),
  error: (err: unknown) => console.error('Erro:', err),
  complete: () => console.log('\nDemonstração concluída.'),
});
