/**
 * sensor-simulator.ts – Demo sensor data generator.
 *
 * makeDemoReadings(rng) produces 11 readings in the specified ranges:
 *   [24..27, 30..36, 30..36, 30..36, 30..36, 28..29, 28, 24..27, 30..36, 30..36, 30..36]
 *
 * - Positions with a range use Math.floor(rng() * (max - min + 1)) + min
 * - Position 7 (index 6) is always 28 (fixed)
 * - rng() === 0   => lower bound of each range
 * - rng() === 0.999999 => upper bound (floor of 0.999999 * range_size + min)
 * - Timestamps start at 2026-01-01T12:00:00Z, 1-second intervals
 */

import type { TemperatureReading } from '../domain/types.ts';

type Range = readonly [number, number] | readonly [28, 28];

/** Returns an integer in [min, max] inclusive, using rng in [0, 1). */
function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const RANGES: Array<Range | null> = [
  [24, 27],  // 0
  [30, 36],  // 1
  [30, 36],  // 2
  [30, 36],  // 3
  [30, 36],  // 4
  [28, 29],  // 5
  null,      // 6 – fixed 28
  [24, 27],  // 7
  [30, 36],  // 8
  [30, 36],  // 9
  [30, 36],  // 10
];

const SENSOR_ID = 'sensor-01';
const START_TS = new Date('2026-01-01T12:00:00Z').getTime();

export function makeDemoReadings(rng: () => number = Math.random): TemperatureReading[] {
  return RANGES.map((range, i): TemperatureReading => {
    const temp = range === null ? 28 : randomInt(rng, range[0], range[1]);
    return {
      sensorId: SENSOR_ID,
      temperature: temp,
      timestamp: START_TS + i * 1000,
    };
  });
}
