import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { AUDIO_SYNTH } from '../../../application/ports/audio-synth.port';
import { HAND_TRACKING } from '../../../application/ports/hand-tracking.port';
import { mapPoseToThereminParams, smoothParams } from '../../../domain/theremin/mapping/map-pose-to-params';
import {
  HandTrackingFrame,
  ThereminParams
} from '../../../domain/theremin/models/hand-tracking.model';
import { SettingsStore } from '../../settings/state/settings.store';

type PlayStatus = 'idle' | 'active' | 'error';
type CameraPermission = 'unknown' | 'granted' | 'denied';

type PlayState = {
  status: PlayStatus;
  permission: CameraPermission;
  isRecording: boolean;
  isTracking: boolean;
  pitchHz: number;
  gain: number;
  errorMessageKey: string | null;
  lastFrame: HandTrackingFrame | null;
};

const initialState: PlayState = {
  status: 'idle',
  permission: 'unknown',
  isRecording: false,
  isTracking: false,
  pitchHz: 440,
  gain: 0.2,
  errorMessageKey: null,
  lastFrame: null
};

export const PlayStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ status, permission, errorMessageKey, isRecording, isTracking }) => ({
    isActive: computed(() => status() === 'active'),
    canStart: computed(() => status() !== 'active' && permission() !== 'denied'),
    isTracking: computed(() => isTracking()),
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
    const tracking = inject(HAND_TRACKING);
    const settings = inject(SettingsStore);

    let lastParams: ThereminParams = {
      pitchHz: store.pitchHz(),
      gain: store.gain()
    };
    let lastTimestamp = 0;

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

    const handleTrackingError = (error: unknown): void => {
      const isPermissionError =
        error instanceof DOMException && error.name === 'NotAllowedError';
      patchState(store, {
        permission: isPermissionError ? 'denied' : 'unknown',
        isTracking: false,
        status: 'error',
        errorMessageKey: isPermissionError
          ? 'PLAY.ERROR_CAMERA_PERMISSION'
          : 'PLAY.ERROR_HAND_TRACKING'
      });
      audio.stop();
      tracking.stop();
    };

    const handleFrame = (frame: HandTrackingFrame): void => {
      const mappingConfig = {
        minHz: settings.minHz(),
        maxHz: settings.maxHz(),
        volumeCurve: settings.volumeCurve(),
        quantize: settings.quantize(),
        swapHands: settings.swapHands(),
        volumeInverted: false
      };

      const nextParams = mapPoseToThereminParams(frame, mappingConfig, lastParams);
      const deltaMs = lastTimestamp ? frame.timestampMs - lastTimestamp : 0;
      const smoothed = smoothParams(
        lastParams,
        nextParams,
        settings.smoothingMs(),
        deltaMs
      );

      lastParams = smoothed;
      lastTimestamp = frame.timestampMs;

      patchState(store, { lastFrame: frame });
      audio.setPitchHz(smoothed.pitchHz);
      audio.setGain(smoothed.gain);
      patchState(store, { pitchHz: smoothed.pitchHz, gain: smoothed.gain });
    };

    const startTracking = async (video: HTMLVideoElement): Promise<void> => {
      await tracking.start({
        video,
        onFrame: handleFrame,
        onError: handleTrackingError
      });

      if (tracking.isRunning()) {
        patchState(store, { permission: 'granted', isTracking: true });
      }
    };

    return {
      start(video?: HTMLVideoElement): void {
        void (async () => {
          await startAudio();
          if (store.status() === 'error') {
            return;
          }
          if (!video) {
            handleTrackingError(new Error('Missing video element'));
            return;
          }

          await startTracking(video);
        })();
      },
      stop(): void {
        audio.stop();
        tracking.stop();
        patchState(store, {
          status: 'idle',
          isRecording: false,
          isTracking: false,
          lastFrame: null
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
      },
      clearFrame(): void {
        patchState(store, { lastFrame: null });
      }
    };
  })
);

export type PlayStore = InstanceType<typeof PlayStore>;
