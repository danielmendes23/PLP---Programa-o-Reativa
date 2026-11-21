/** Contrato fixo compartilhado com o experimento. Apenas UM sensor por execução. */
export interface TemperatureReading {
  readonly sensorId: string;
  readonly temperature: number;
  readonly timestamp: number; // milissegundos desde epoch
}

export type MonitorEvent =
  | { readonly type: 'critical'; readonly sensorId: string;
      readonly temperature: number; readonly timestamp: number }
  | { readonly type: 'normalized'; readonly sensorId: string;
      readonly temperature: number; readonly timestamp: number };

export interface MonitorState {
  readonly consecutiveHighs: number;
  readonly alerted: boolean;
}

export interface Transition {
  readonly state: MonitorState;
  readonly event: MonitorEvent | null;
}
