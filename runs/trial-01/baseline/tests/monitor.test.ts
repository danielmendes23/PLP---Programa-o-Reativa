/**
 * monitor.test.ts – Domain tests for monitorReadings.
 *
 * Tests do NOT rely on the demo's random number generator.
 */

import { from } from 'rxjs';
import { monitorReadings } from '../src/application/monitor.ts';
import type { MonitorEvent, TemperatureReading } from '../src/domain/types.ts';
import { makeDemoReadings } from '../src/infrastructure/sensor-simulator.ts';

/** Helper: collect all events from an observable synchronously. */
function collectEvents(readings: TemperatureReading[]): MonitorEvent[] {
  const events: MonitorEvent[] = [];
  monitorReadings(from(readings)).subscribe((e) => events.push(e));
  return events;
}

function reading(temperature: number, index = 0): TemperatureReading {
  return { sensorId: 'S1', temperature, timestamp: 1000 * index };
}

function readings(...temps: number[]): TemperatureReading[] {
  return temps.map((t, i) => reading(t, i));
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. Basic critical trigger
// ──────────────────────────────────────────────────────────────────────────────
describe('critical alert', () => {
  it('emits critical on exactly the 3rd consecutive reading >= 30', () => {
    const events = collectEvents(readings(30, 30, 30));
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('critical');
  });

  it('does NOT emit critical on only 2 consecutive highs', () => {
    const events = collectEvents(readings(30, 30, 29));
    expect(events).toHaveLength(0);
  });

  it('does NOT emit critical on only 1 high', () => {
    expect(collectEvents(readings(35))).toHaveLength(0);
  });

  it('emits critical on reading with temp exactly 30', () => {
    const r = readings(30, 30, 30);
    const events = collectEvents(r);
    expect(events[0]?.type).toBe('critical');
  });

  it('preserves sensorId, temperature and timestamp of triggering reading', () => {
    const r: TemperatureReading[] = [
      { sensorId: 'ABC', temperature: 31, timestamp: 100 },
      { sensorId: 'ABC', temperature: 32, timestamp: 200 },
      { sensorId: 'ABC', temperature: 33, timestamp: 300 },
    ];
    const events = collectEvents(r);
    expect(events[0]).toEqual({ type: 'critical', sensorId: 'ABC', temperature: 33, timestamp: 300 });
  });

  it('does NOT emit a 2nd critical while alerted', () => {
    // 5 consecutive highs after alert should produce only 1 critical
    const events = collectEvents(readings(30, 30, 30, 31, 32, 33));
    const criticals = events.filter((e) => e.type === 'critical');
    expect(criticals).toHaveLength(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Normalization
// ──────────────────────────────────────────────────────────────────────────────
describe('normalized event', () => {
  it('emits normalized when temp drops below 28 after critical', () => {
    const events = collectEvents(readings(30, 30, 30, 27));
    expect(events).toHaveLength(2);
    expect(events[1]?.type).toBe('normalized');
  });

  it('preserves sensorId, temperature and timestamp of normalizing reading', () => {
    const r: TemperatureReading[] = [
      { sensorId: 'X1', temperature: 30, timestamp: 1000 },
      { sensorId: 'X1', temperature: 30, timestamp: 2000 },
      { sensorId: 'X1', temperature: 30, timestamp: 3000 },
      { sensorId: 'X1', temperature: 25, timestamp: 4000 },
    ];
    const events = collectEvents(r);
    expect(events[1]).toEqual({ type: 'normalized', sensorId: 'X1', temperature: 25, timestamp: 4000 });
  });

  it('does NOT emit normalized without prior critical', () => {
    const events = collectEvents(readings(25, 26, 20));
    expect(events).toHaveLength(0);
  });

  it('temp exactly 28 does NOT normalize', () => {
    const events = collectEvents(readings(30, 30, 30, 28));
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('critical');
  });

  it('temp exactly 27.999 normalizes', () => {
    const events = collectEvents(readings(30, 30, 30, 27.999));
    expect(events).toHaveLength(2);
    expect(events[1]?.type).toBe('normalized');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Middle zone (28 <= temp < 30) – interrupt count, never normalizes
// ──────────────────────────────────────────────────────────────────────────────
describe('middle zone (28–29)', () => {
  it('interrupts pending count without emitting event', () => {
    // 2 highs then middle zone then 2 more highs: no critical
    const events = collectEvents(readings(30, 30, 28, 30, 30));
    expect(events).toHaveLength(0);
  });

  it('requires 3 consecutive highs after reset by middle zone', () => {
    const events = collectEvents(readings(30, 30, 29, 30, 30, 30));
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('critical');
  });

  it('middle zone does NOT normalize an active alert', () => {
    // critical then middle zone: still alerted
    const events = collectEvents(readings(30, 30, 30, 29));
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('critical');
  });

  it('temp 29.999 is still middle zone (not high, not low)', () => {
    const events = collectEvents(readings(30, 30, 29.999));
    expect(events).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Non-finite values
// ──────────────────────────────────────────────────────────────────────────────
describe('non-finite values', () => {
  it('NaN interrupts pending count without emitting', () => {
    const events = collectEvents(readings(30, 30, NaN, 30, 30));
    expect(events).toHaveLength(0);
  });

  it('Infinity interrupts pending count without emitting', () => {
    const events = collectEvents(readings(30, 30, Infinity));
    expect(events).toHaveLength(0);
  });

  it('-Infinity interrupts pending count without emitting', () => {
    const events = collectEvents(readings(30, 30, -Infinity));
    expect(events).toHaveLength(0);
  });

  it('NaN does NOT normalize an active critical alert', () => {
    const events = collectEvents(readings(30, 30, 30, NaN));
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('critical');
    // still alerted after NaN: a low temp now should still normalize
    const events2 = collectEvents(readings(30, 30, 30, NaN, 20));
    expect(events2).toHaveLength(2);
    expect(events2[1]?.type).toBe('normalized');
  });

  it('Infinity does NOT normalize an active critical alert', () => {
    const events = collectEvents(readings(30, 30, 30, Infinity));
    expect(events).toHaveLength(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. After normalization, a new sequence of 3 highs triggers another critical
// ──────────────────────────────────────────────────────────────────────────────
describe('re-alert after normalization', () => {
  it('emits a second critical after normalization', () => {
    const events = collectEvents(readings(30, 30, 30, 20, 30, 30, 30));
    expect(events).toHaveLength(3);
    expect(events[0]?.type).toBe('critical');
    expect(events[1]?.type).toBe('normalized');
    expect(events[2]?.type).toBe('critical');
  });

  it('low reading before first alert does NOT trigger normalized', () => {
    const events = collectEvents(readings(25, 20, 15));
    expect(events).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. Empty and single-reading streams
// ──────────────────────────────────────────────────────────────────────────────
describe('edge cases', () => {
  it('empty stream emits no events', () => {
    expect(collectEvents([])).toHaveLength(0);
  });

  it('single high reading emits no events', () => {
    expect(collectEvents(readings(35))).toHaveLength(0);
  });

  it('single low reading emits no events', () => {
    expect(collectEvents(readings(10))).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. Demo simulator – structural tests (no randomness in assertions)
// ──────────────────────────────────────────────────────────────────────────────
describe('makeDemoReadings', () => {
  it('returns exactly 11 readings', () => {
    expect(makeDemoReadings(() => 0)).toHaveLength(11);
  });

  it('uses sensor-01 for all readings', () => {
    const r = makeDemoReadings(() => 0);
    expect(r.every((x) => x.sensorId === 'sensor-01')).toBe(true);
  });

  it('timestamps start at 2026-01-01T12:00:00Z and are 1 s apart', () => {
    const r = makeDemoReadings(() => 0);
    const startMs = new Date('2026-01-01T12:00:00Z').getTime();
    r.forEach((x, i) => {
      expect(x.timestamp).toBe(startMs + i * 1000);
    });
  });

  it('with rng===0 returns lower bounds', () => {
    const r = makeDemoReadings(() => 0);
    // pos 0: 24, pos 1-4: 30, pos 5: 28, pos 6: 28, pos 7: 24, pos 8-10: 30
    expect(r[0]?.temperature).toBe(24);
    expect(r[1]?.temperature).toBe(30);
    expect(r[2]?.temperature).toBe(30);
    expect(r[3]?.temperature).toBe(30);
    expect(r[4]?.temperature).toBe(30);
    expect(r[5]?.temperature).toBe(28);
    expect(r[6]?.temperature).toBe(28);
    expect(r[7]?.temperature).toBe(24);
    expect(r[8]?.temperature).toBe(30);
    expect(r[9]?.temperature).toBe(30);
    expect(r[10]?.temperature).toBe(30);
  });

  it('with rng===0.999999 returns upper bounds', () => {
    const r = makeDemoReadings(() => 0.999999);
    expect(r[0]?.temperature).toBe(27);
    expect(r[1]?.temperature).toBe(36);
    expect(r[5]?.temperature).toBe(29);
    expect(r[6]?.temperature).toBe(28); // fixed
    expect(r[7]?.temperature).toBe(27);
    expect(r[10]?.temperature).toBe(36);
  });

  it('the 7th reading (index 6) is always exactly 28 regardless of rng', () => {
    expect(makeDemoReadings(() => 0)[6]?.temperature).toBe(28);
    expect(makeDemoReadings(() => 0.999999)[6]?.temperature).toBe(28);
    expect(makeDemoReadings(() => 0.5)[6]?.temperature).toBe(28);
  });

  it('demo sequence with min values yields critical → normalized → critical', () => {
    const r = makeDemoReadings(() => 0);
    // Sequence: 24, 30, 30, 30, 30, 28, 28, 24, 30, 30, 30
    // Events: critical at pos3, normalized at pos7, critical at pos10
    const events = collectEvents(r);
    expect(events).toHaveLength(3);
    expect(events[0]?.type).toBe('critical');
    expect(events[1]?.type).toBe('normalized');
    expect(events[2]?.type).toBe('critical');
  });

  it('demo sequence with max values yields critical → normalized → critical', () => {
    const r = makeDemoReadings(() => 0.999999);
    // Sequence: 27, 36, 36, 36, 36, 29, 28, 27, 36, 36, 36
    const events = collectEvents(r);
    expect(events).toHaveLength(3);
    expect(events[0]?.type).toBe('critical');
    expect(events[1]?.type).toBe('normalized');
    expect(events[2]?.type).toBe('critical');
  });
});
