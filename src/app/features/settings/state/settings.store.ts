import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

type VolumeCurve = 'linear' | 'expo';

type SettingsState = {
  minHz: number;
  maxHz: number;
  smoothingMs: number;
  swapHands: boolean;
  quantize: boolean;
  volumeCurve: VolumeCurve;
};

const initialState: SettingsState = {
  minHz: 40,
  maxHz: 600,
  smoothingMs: 40,
  swapHands: false,
  quantize: true,
  volumeCurve: 'expo'
};

export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ swapHands, quantize }) => ({
    swapHandsLabelKey: computed(() => (swapHands() ? 'COMMON.YES' : 'COMMON.NO')),
    quantizeLabelKey: computed(() => (quantize() ? 'COMMON.YES' : 'COMMON.NO'))
  })),
  withMethods((store) => ({
    setRange(minHz: number, maxHz: number): void {
      patchState(store, { minHz, maxHz });
    },
    setSmoothing(smoothingMs: number): void {
      patchState(store, { smoothingMs });
    },
    toggleSwapHands(): void {
      patchState(store, { swapHands: !store.swapHands() });
    },
    toggleQuantize(): void {
      patchState(store, { quantize: !store.quantize() });
    },
    setVolumeCurve(volumeCurve: VolumeCurve): void {
      patchState(store, { volumeCurve });
    }
  }))
);

export type SettingsStore = InstanceType<typeof SettingsStore>;
