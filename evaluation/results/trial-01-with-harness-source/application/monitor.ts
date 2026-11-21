import { Observable } from 'rxjs';
import { scan, map, filter } from 'rxjs/operators';
import { advanceMonitor, initialMonitorState } from '../domain/temperature-policy.ts';
import type { MonitorEvent, TemperatureReading, Transition } from '../domain/types.ts';

export function monitorReadings(
  readings$: Observable<TemperatureReading>,
): Observable<MonitorEvent> {
  return readings$.pipe(
    scan(
      (transition: Transition, reading: TemperatureReading): Transition =>
        advanceMonitor(transition.state, reading),
      { state: initialMonitorState(), event: null } as Transition,
    ),
    map((t: Transition): MonitorEvent | null => t.event),
    filter((e): e is MonitorEvent => e !== null),
  );
}
