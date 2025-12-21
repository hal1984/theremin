import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { AUDIO_SYNTH } from '../../../application/ports/audio-synth.port';

type PlayStatus = 'idle' | 'active' | 'error';
type CameraPermission = 'unknown' | 'granted' | 'denied';

type PlayState = {
  status: PlayStatus;
  permission: CameraPermission;
  isRecording: boolean;
  pitchHz: number;
  gain: number;
  errorMessageKey: string | null;
};

const initialState: PlayState = {
  status: 'idle',
  permission: 'unknown',
  isRecording: false,
  pitchHz: 440,
  gain: 0.2,
  errorMessageKey: null
};

export const PlayStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ status, permission, errorMessageKey, isRecording }) => ({
    isActive: computed(() => status() === 'active'),
    canStart: computed(() => status() !== 'active' && permission() !== 'denied'),
    hasError: computed(() => errorMessageKey() !== null),
    statusLabelKey: computed(() => {
      if (status() === 'active') {
        return 'PLAY.STATUS_ACTIVE';
      }

      if (status() === 'error') {
        return 'PLAY.STATUS_ERROR';
      }

      return 'PLAY.STATUS_READY';
    }),
    recordingLabelKey: computed(() =>
      isRecording() ? 'PLAY.RECORD_ACTIVE' : 'PLAY.RECORD_IDLE'
    )
  })),
  withMethods((store) => {
    const audio = inject(AUDIO_SYNTH);

    const startAudio = async (): Promise<void> => {
      try {
        await audio.start();
        audio.setPitchHz(store.pitchHz());
        audio.setGain(store.gain());
        patchState(store, { status: 'active', errorMessageKey: null });
      } catch (error) {
        patchState(store, {
          status: 'error',
          errorMessageKey: 'PLAY.ERROR_START_AUDIO'
        });
      }
    };

    return {
      start(): void {
        void startAudio();
      },
      stop(): void {
        audio.stop();
        patchState(store, {
          status: 'idle',
          isRecording: false
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
        audio.setPitchHz(pitchHz);
        patchState(store, { pitchHz });
      },
      setGain(gain: number): void {
        audio.setGain(gain);
        patchState(store, { gain });
      },
      setError(errorKey: string | null): void {
        patchState(store, {
          errorMessageKey: errorKey,
          status: errorKey ? 'error' : 'idle'
        });
      }
    };
  })
);

export type PlayStore = InstanceType<typeof PlayStore>;
