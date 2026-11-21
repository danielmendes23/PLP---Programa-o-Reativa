import type { MonitorState, TemperatureReading, Transition } from './types.ts';

export function initialMonitorState(): MonitorState {
  return { consecutiveHighs: 0, alerted: false };
}

/** Função pura: mesma entrada e estado sempre produzem mesma saída. */
export function advanceMonitor(state: MonitorState, reading: TemperatureReading): Transition {
  const { temperature, sensorId, timestamp } = reading;
  // Não confundir dado inválido com normalização; o alarme existente permanece.
  if (!Number.isFinite(temperature) || !Number.isFinite(timestamp) ||
      !sensorId.trim()) {
    return { state: { ...state, consecutiveHighs: 0 }, event: null };
  }

  if (temperature < 28) {
    return {
      state: initialMonitorState(),
      event: state.alerted
        ? { type: 'normalized', sensorId, temperature, timestamp }
        : null
    };
  }

  if (temperature >= 30) {
    if (state.alerted) return { state: { ...state, consecutiveHighs: 0 }, event: null };
    const consecutiveHighs = state.consecutiveHighs + 1;
    if (consecutiveHighs >= 3) {
      return {
        state: { consecutiveHighs: 0, alerted: true },
        event: { type: 'critical', sensorId, temperature, timestamp }
      };
    }
    return { state: { consecutiveHighs, alerted: false }, event: null };
  }

  // 28 <= temperatura < 30: quebra sequência alta sem normalizar alerta.
  return { state: { ...state, consecutiveHighs: 0 }, event: null };
}
