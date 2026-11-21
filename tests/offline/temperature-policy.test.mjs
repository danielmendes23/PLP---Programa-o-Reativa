import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceMonitor, initialMonitorState } from '../../src/domain/temperature-policy.ts';
const r = t => ({ sensorId: 'sensor-01', temperature: t, timestamp: 0 });
function play(temperatures) {
  let state = initialMonitorState();
  const events = [];
  for (const temperature of temperatures) {
    const next = advanceMonitor(state, r(temperature));
    state = next.state;
    if (next.event) events.push(next.event.type);
  }
  return events;
}
test('3 altas => alertar uma vez', () =>
  assert.deepEqual(play([30, 31, 32, 35]), ['critical']));
test('normalização estritamente abaixo de 28', () =>
  assert.deepEqual(play([30, 30, 30, 28, 27]), ['critical', 'normalized']));
test('sem alertas repetidos e rearme após normalização', () =>
  assert.deepEqual(play([30, 30, 30, 35, 27, 30, 30, 30]),
    ['critical', 'normalized', 'critical']));
test('número não finito interrompe sequência', () =>
  assert.deepEqual(play([30, NaN, 30, 30]), []));
test('28 ou 29 interrompem contagem alta', () =>
  assert.deepEqual(play([30, 30, 28, 30, 30]), []));
test('função não altera estado de entrada', () => {
  const state = Object.freeze(initialMonitorState());
  advanceMonitor(state, r(30));
  assert.deepEqual(state, { alerted: false, consecutiveHighs: 0 });
});
