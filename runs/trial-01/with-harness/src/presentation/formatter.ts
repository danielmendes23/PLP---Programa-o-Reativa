import type { MonitorEvent } from '../domain/types.ts';

export function formatEvent(event: MonitorEvent): string {
  const time = new Date(event.timestamp).toISOString();
  const label = event.type === 'critical' ? '🔴 CRITICAL' : '🟢 NORMALIZED';
  return `[${time}] ${label} | sensor=${event.sensorId} | temp=${event.temperature}°C`;
}
