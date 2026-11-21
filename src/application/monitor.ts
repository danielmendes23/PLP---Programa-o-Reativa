import { filter, map, scan, type Observable } from 'rxjs';
import { advanceMonitor, initialMonitorState } from '../domain/temperature-policy.ts';
import type { MonitorEvent, MonitorState, TemperatureReading, Transition } from '../domain/types.ts';

/** Fluxo reativo sem side effects: consumidor decide como apresentar eventos. */
export function monitorReadings(readings$: Observable<TemperatureReading>): Observable<MonitorEvent> {
  const initial: Transition = { state: initialMonitorState(), event: null };
  return readings$.pipe(
    scan((acc: Transition, reading: TemperatureReading): Transition =>
      advanceMonitor(acc.state, reading), initial),
    map(({ event }: { event: MonitorEvent | null; state: MonitorState }) => event),
    filter((event: MonitorEvent | null): event is MonitorEvent => event !== null)
  );
}
