/** AVALIAÇÃO INDEPENDENTE. Não copiar para os workspaces antes da geração. */
import { describe, expect, it } from 'vitest';
import { from } from 'rxjs';
import { monitorReadings } from '../../src/application/monitor.ts';
import type { MonitorEvent, TemperatureReading } from '../../src/domain/types.ts';

const readings = (temperatures: number[]): TemperatureReading[] =>
  temperatures.map((temperature, i) => ({ sensorId: 'sensor-01', temperature, timestamp: i }));
async function run(temperatures: number[]): Promise<MonitorEvent[]> {
  const events: MonitorEvent[] = [];
  await new Promise<void>((resolve, reject) => {
    monitorReadings(from(readings(temperatures))).subscribe({
      next: value => events.push(value), error: reject, complete: resolve
    });
  });
  return events;
}

const kinds = (events: MonitorEvent[]): string[] => events.map(e => e.type);

describe('avaliação externa das implementações', () => {
  it('1: eventos são emitidos apenas após a terceira leitura alta', async () => {
    const events = await run([29, 30, 31, 32]);
    expect(kinds(events)).toEqual(['critical']);
    expect(events[0]).toMatchObject({ sensorId: 'sensor-01', temperature: 32, timestamp: 3 });
  });
  it('2: alertas consecutivos não são repetidos', async () => {
    expect(kinds(await run([30, 30, 30, 34, 40, 35]))).toEqual(['critical']);
  });
  it('3: 28°C não normaliza e uma leitura abaixo de 28°C normaliza', async () => {
    expect(kinds(await run([30, 30, 30, 28, 29, 27])))
      .toEqual(['critical', 'normalized']);
  });
  it('4: série alta interrompida não cria evento', async () => {
    expect(kinds(await run([30, 30, 29, 30, 30]))).toEqual([]);
  });
  it('5: após normalizar, nova série emite alerta novamente', async () => {
    expect(kinds(await run([30, 30, 30, 27, 30, 30, 30])))
      .toEqual(['critical', 'normalized', 'critical']);
  });
  it('6: valores não finitos interrompem a contagem sem limpar alerta existente', async () => {
    expect(kinds(await run([30, 30, NaN, 30, 30, 30, Infinity, 27])))
      .toEqual(['critical', 'normalized']);
  });
  it('7: um fluxo sem condição crítica não emite eventos', async () => {
    expect(kinds(await run([27, 28, 29, 30, 27, 30]))).toEqual([]);
  });
  it('8: saída preserva timestamp e valor na normalização', async () => {
    const events = await run([30, 31, 32, 27]);
    expect(events[1]).toMatchObject({ type: 'normalized', temperature: 27, timestamp: 3 });
  });
});
