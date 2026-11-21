/**
 * monitor.ts – Monitoring logic for temperature readings using RxJS.
 *
 * Rules:
 * 1. Emit 'critical' on exactly the 3rd consecutive reading >= 30 °C.
 * 2. While critical (alerted), do NOT emit new critical events.
 * 3. Emit 'normalized' only when temperature drops strictly below 28 °C.
 * 4. A reading 28 <= temp < 30 interrupts the pending count but does NOT normalize.
 * 5. Non-finite values (NaN, Infinity) interrupt pending count, no event, no normalize.
 * 6. After normalization, a new sequence of three highs can fire another alert.
 * 7. Preserve sensorId, temperature, and timestamp of the triggering reading.
 */

import { Observable } from 'rxjs';
import { scan, filter, map } from 'rxjs/operators';
import type { MonitorEvent, MonitorState, TemperatureReading, Transition } from '../domain/types.ts';

const INITIAL_STATE: MonitorState = { consecutiveHighs: 0, alerted: false };

function transition(state: MonitorState, reading: TemperatureReading): Transition {
  const temp = reading.temperature;

  // Invalid (non-finite) value: reset count, keep alerted state, no event
  if (!isFinite(temp)) {
    return {
      state: { consecutiveHighs: 0, alerted: state.alerted },
      event: null,
    };
  }

  // High: temp >= 30
  if (temp >= 30) {
    if (state.alerted) {
      // Already in critical state: accumulate but don't emit
      return {
        state: { consecutiveHighs: state.consecutiveHighs + 1, alerted: true },
        event: null,
      };
    }
    const newCount = state.consecutiveHighs + 1;
    if (newCount >= 3) {
      // Third (or more) consecutive high and not alerted: emit critical
      const evt: MonitorEvent = {
        type: 'critical',
        sensorId: reading.sensorId,
        temperature: reading.temperature,
        timestamp: reading.timestamp,
      };
      return {
        state: { consecutiveHighs: newCount, alerted: true },
        event: evt,
      };
    }
    return {
      state: { consecutiveHighs: newCount, alerted: false },
      event: null,
    };
  }

  // Middle zone: 28 <= temp < 30 — interrupts pending count, never normalizes
  if (temp >= 28) {
    return {
      state: { consecutiveHighs: 0, alerted: state.alerted },
      event: null,
    };
  }

  // Low: temp < 28 — reset count, normalize if was alerted
  if (state.alerted) {
    const evt: MonitorEvent = {
      type: 'normalized',
      sensorId: reading.sensorId,
      temperature: reading.temperature,
      timestamp: reading.timestamp,
    };
    return {
      state: { consecutiveHighs: 0, alerted: false },
      event: evt,
    };
  }
  return {
    state: { consecutiveHighs: 0, alerted: false },
    event: null,
  };
}

export function monitorReadings(
  readings$: Observable<TemperatureReading>,
): Observable<MonitorEvent> {
  return readings$.pipe(
    scan<TemperatureReading, Transition>(
      (prev, reading) => transition(prev.state, reading),
      { state: INITIAL_STATE, event: null },
    ),
    filter((t): t is Transition & { event: MonitorEvent } => t.event !== null),
    map((t) => t.event),
  );
}
