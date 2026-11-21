/** Avaliação EXTERNA do simulador; não distribuir aos agentes antes de concluírem. */
import { describe, expect, it } from 'vitest';
import { from, lastValueFrom, toArray } from 'rxjs';
import { makeDemoReadings } from '../../src/infrastructure/sensor-simulator.ts';
import { monitorReadings } from '../../src/application/monitor.ts';

const bands: ReadonlyArray<readonly [number, number]> = [
  [24, 27], [30, 36], [30, 36], [30, 36], [30, 36],
  [28, 29], [28, 28], [24, 27], [30, 36], [30, 36], [30, 36]
];
const start = Date.UTC(2026, 0, 1, 12, 0, 0);

function assertBands(values: ReturnType<typeof makeDemoReadings>): void {
  expect(values).toHaveLength(11);
  values.forEach((r, index) => {
    const band = bands[index];
    expect(band).toBeDefined();
    if (!band) throw new Error('Faixa não definida');
    expect(Number.isInteger(r.temperature)).toBe(true);
    expect(r.temperature).toBeGreaterThanOrEqual(band[0]);
    expect(r.temperature).toBeLessThanOrEqual(band[1]);
  });
}

describe('avaliação externa da demonstração com aleatoriedade controlada', () => {
  it('9: cria exatamente 11 leituras ordenadas e preserva sensor e timestamps', () => {
    const values = makeDemoReadings(() => 0.5);
    assertBands(values);
    expect(values.map(v => v.sensorId)).toEqual(Array(11).fill('sensor-01'));
    expect(values.map(v => v.timestamp)).toEqual(Array.from({ length: 11 }, (_, i) => start + i * 1000));
  });
  it('10: gerador injetado 0 produz os limites inferiores inclusivos', () => {
    const values = makeDemoReadings(() => 0);
    expect(values.map(v => v.temperature)).toEqual(bands.map(b => b[0]));
  });
  it('11: gerador injetado próximo de 1 produz os limites superiores inclusivos', () => {
    const values = makeDemoReadings(() => 0.999999);
    expect(values.map(v => v.temperature)).toEqual(bands.map(b => b[1]));
  });
  it('12: por padrão retorna temperaturas dentro das faixas previstas', () => {
    assertBands(makeDemoReadings());
  });
  it('13: as duas sequências extremas produzem exatamente crítico, normalizado, crítico', async () => {
    for (const rng of [() => 0, () => 0.999999]) {
      const values = makeDemoReadings(rng);
      const events = await lastValueFrom(monitorReadings(from(values)).pipe(toArray()));
      expect(events.map(e => e.type)).toEqual(['critical', 'normalized', 'critical']);
      expect(events.map(e => e.timestamp)).toEqual([start + 3000, start + 7000, start + 10000]);
    }
  });
});
