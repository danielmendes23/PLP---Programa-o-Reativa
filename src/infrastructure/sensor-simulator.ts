import { concatMap, delay, from, of, type Observable } from 'rxjs';
import type { TemperatureReading } from '../domain/types.ts';

/** Sorteia inteiros inclusivos para a demonstracao; nao usar aleatoriedade nos testes. */
function randomInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Demonstracao com valores variaveis e comportamento previsivel:
 * primeiro critico, normalizacao e segundo critico.
 * Os testes independentes avaliam sequencias FIXAS fornecidas ao monitor.
 */
export function makeDemoReadings(rng: () => number = Math.random): TemperatureReading[] {
  const temperatures = [
    randomInt(24, 27, rng), // temperatura normal
    randomInt(30, 36, rng), // alta 1
    randomInt(30, 36, rng), // alta 2
    randomInt(30, 36, rng), // alta 3: primeiro critico
    randomInt(30, 36, rng), // permanece em alerta, sem repetir
    randomInt(28, 29, rng), // intermediaria: nao normaliza
    28,                // limite exato: ainda nao normaliza
    randomInt(24, 27, rng), // abaixo de 28: normaliza
    randomInt(30, 36, rng), // alta 1
    randomInt(30, 36, rng), // alta 2
    randomInt(30, 36, rng)  // alta 3: segundo critico
  ];
  const start = Date.UTC(2026, 0, 1, 12, 0, 0);
  return temperatures.map((temperature, i) => ({
    sensorId: 'sensor-01', temperature, timestamp: start + i * 1000
  }));
}

export function simulatedSensor$(intervalMs = 140): Observable<TemperatureReading> {
  return from(makeDemoReadings()).pipe(
    concatMap(reading => of(reading).pipe(delay(intervalMs)))
  );
}
