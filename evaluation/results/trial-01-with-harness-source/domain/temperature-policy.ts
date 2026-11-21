import type { MonitorEvent, MonitorState, TemperatureReading, Transition } from './types.ts';

export function initialMonitorState(): MonitorState {
  return { consecutiveHighs: 0, alerted: false };
}

export function advanceMonitor(
  state: MonitorState,
  reading: TemperatureReading,
): Transition {
  const { temperature, sensorId, timestamp } = reading;

  // Valores não finitos interrompem contagem pendente sem emitir evento e sem normalizar
  if (!Number.isFinite(temperature)) {
    return {
      state: { consecutiveHighs: 0, alerted: state.alerted },
      event: null,
    };
  }

  // Temperatura >= 30: incrementa contagem de altas
  if (temperature >= 30) {
    if (state.alerted) {
      // Já em alerta: mantém estado, não emite novo evento
      return {
        state: { consecutiveHighs: state.consecutiveHighs + 1, alerted: true },
        event: null,
      };
    }
    const newConsecutiveHighs = state.consecutiveHighs + 1;
    if (newConsecutiveHighs >= 3) {
      // Terceira alta consecutiva: emite critical
      const event: MonitorEvent = { type: 'critical', sensorId, temperature, timestamp };
      return {
        state: { consecutiveHighs: newConsecutiveHighs, alerted: true },
        event,
      };
    }
    return {
      state: { consecutiveHighs: newConsecutiveHighs, alerted: false },
      event: null,
    };
  }

  // Temperatura < 28: normaliza se estava em alerta, zera contagem
  if (temperature < 28) {
    if (state.alerted) {
      const event: MonitorEvent = { type: 'normalized', sensorId, temperature, timestamp };
      return {
        state: { consecutiveHighs: 0, alerted: false },
        event,
      };
    }
    return {
      state: { consecutiveHighs: 0, alerted: false },
      event: null,
    };
  }

  // 28 <= temperature < 30: interrompe contagem pendente, não normaliza alerta ativo
  return {
    state: { consecutiveHighs: 0, alerted: state.alerted },
    event: null,
  };
}
