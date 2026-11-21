import type { TemperatureReading } from '../domain/types.ts';

// Faixas da sequência de demonstração (11 leituras)
const RANGES: ReadonlyArray<readonly [number, number]> = [
  [24, 27], // 1
  [30, 36], // 2
  [30, 36], // 3
  [30, 36], // 4
  [30, 36], // 5
  [28, 29], // 6
  [28, 28], // 7 (fixo 28, mas usamos faixa de um único valor)
  [24, 27], // 8
  [30, 36], // 9
  [30, 36], // 10
  [30, 36], // 11
];

function pickInteger(min: number, max: number, rng: () => number): number {
  if (min === max) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

export function makeDemoReadings(rng: () => number = Math.random): TemperatureReading[] {
  const baseTime = new Date('2026-01-01T12:00:00Z').getTime();
  const sensorId = 'sensor-01';

  return RANGES.map(([min, max], index) => ({
    sensorId,
    temperature: pickInteger(min, max, rng),
    timestamp: baseTime + index * 1000,
  }));
}
