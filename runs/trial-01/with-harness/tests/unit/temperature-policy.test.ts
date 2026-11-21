import { describe, expect, it } from 'vitest';
import { advanceMonitor, initialMonitorState } from '../../src/domain/temperature-policy.ts';
import type { TemperatureReading } from '../../src/domain/types.ts';

const r = (t: number): TemperatureReading => ({ sensorId: 'sensor-01', temperature: t, timestamp: 0 });
const play = (temperatures: number[]) => {
  let state = initialMonitorState();
  const events: string[] = [];
  for (const temperature of temperatures) {
    const transition = advanceMonitor(state, r(temperature));
    state = transition.state;
    if (transition.event) events.push(transition.event.type);
  }
  return { events, state };
};

describe('política de monitoramento', () => {
  it('emite crítico na terceira alta seguida', () => {
    expect(play([30, 31, 32]).events).toEqual(['critical']);
  });
  it('não duplica alerta enquanto crítico', () => {
    expect(play([30, 30, 30, 33, 35, 31]).events).toEqual(['critical']);
  });
  it('normaliza abaixo de 28, mas não em 28', () => {
    expect(play([30, 30, 30, 28, 29, 27]).events).toEqual(['critical', 'normalized']);
  });
  it('uma temperatura intermediária interrompe série', () => {
    expect(play([30, 30, 29, 30, 30]).events).toEqual([]);
  });
  it('rearma após normalização', () => {
    expect(play([30, 30, 30, 27, 30, 30, 30]).events)
      .toEqual(['critical', 'normalized', 'critical']);
  });
  it('ignora valor inválido e mantém alerta prévio', () => {
    expect(play([30, 30, NaN, 30, 30, 30, Number.POSITIVE_INFINITY, 27]).events)
      .toEqual(['critical', 'normalized']);
  });
  it('não muta o estado original', () => {
    const state = Object.freeze(initialMonitorState());
    advanceMonitor(state, r(32));
    expect(state).toEqual({ consecutiveHighs: 0, alerted: false });
  });
});
