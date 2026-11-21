/**
 * main.ts – Demo entry point.
 *
 * Run with: npm run demo
 *
 * Generates 11 controlled random readings and prints any MonitorEvents.
 * Expected event sequence: critical → normalized → critical
 */

import { from } from 'rxjs';
import { monitorReadings } from './application/monitor.ts';
import { makeDemoReadings } from './infrastructure/sensor-simulator.ts';
import type { MonitorEvent, TemperatureReading } from './domain/types.ts';

function formatTs(ms: number): string {
  return new Date(ms).toISOString();
}

function printReading(r: TemperatureReading, index: number): void {
  console.log(`  [${index + 1}] sensorId=${r.sensorId}  temp=${r.temperature}°C  ts=${formatTs(r.timestamp)}`);
}

function printEvent(evt: MonitorEvent): void {
  const icon = evt.type === 'critical' ? '🔴' : '🟢';
  console.log(
    `${icon} EVENT: ${evt.type.toUpperCase()}` +
    `  sensorId=${evt.sensorId}` +
    `  temp=${evt.temperature}°C` +
    `  ts=${formatTs(evt.timestamp)}`,
  );
}

const readings = makeDemoReadings();

console.log('=== Temperature Monitor Demo ===\n');
console.log('Readings:');
readings.forEach(printReading);
console.log('\nEvents:');

const readings$ = from(readings);
monitorReadings(readings$).subscribe({
  next: printEvent,
  complete: () => console.log('\nDemo complete.'),
});
