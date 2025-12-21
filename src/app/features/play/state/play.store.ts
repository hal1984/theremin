import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

type PlayStatus = 'idle' | 'active' | 'error';
type CameraPermission = 'unknown' | 'granted' | 'denied';

type PlayState = {
  status: PlayStatus;
  permission: CameraPermission;
  isRecording: boolean;
  pitchHz: number;
  gain: number;
  errorMessage: string | null;
};

const initialState: PlayState = {
  status: 'idle',
  permission: 'unknown',
  isRecording: false,
  pitchHz: 440,
  gain: 0,
  errorMessage: null
};

export const PlayStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ status, permission, errorMessage, isRecording }) => ({
    isActive: computed(() => status() === 'active'),
    canStart: computed(() => status() !== 'active' && permission() !== 'denied'),
    hasError: computed(() => errorMessage() !== null),
    statusLabel: computed(() => {
      if (status() === 'active') {
        return 'Activo';
      }

      if (status() === 'error') {
        return 'Error';
      }

      return 'Listo';
    }),
    recordingLabel: computed(() => (isRecording() ? 'Grabando' : 'Grabar'))
  })),
  withMethods((store) => ({
    start(): void {
      patchState(store, {
        status: 'active',
        errorMessage: null
      });
    },
    stop(): void {
      patchState(store, {
        status: 'idle',
        isRecording: false,
        gain: 0
      });
    },
    setPermission(permission: CameraPermission): void {
      patchState(store, { permission });
    },
    toggleRecording(): void {
      if (store.status() !== 'active') {
        return;
      }

      patchState(store, { isRecording: !store.isRecording() });
    },
    setPitch(pitchHz: number): void {
      patchState(store, { pitchHz });
    },
    setGain(gain: number): void {
      patchState(store, { gain });
    },
    setError(errorMessage: string | null): void {
      patchState(store, {
        errorMessage,
        status: errorMessage ? 'error' : 'idle'
      });
    }
  }))
);

export type PlayStore = InstanceType<typeof PlayStore>;
