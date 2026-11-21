import type { MonitorEvent } from '../domain/types.ts';

export function formatEvent(event: MonitorEvent): string {
  const time = new Date(event.timestamp).toISOString();
  if (event.type === 'critical') {
    return `[${time}] ALERTA CRÍTICO: ${event.sensorId}: ${event.temperature}°C`;
  }
  return `[${time}] NORMALIZADO: ${event.sensorId}: ${event.temperature}°C`;
}
