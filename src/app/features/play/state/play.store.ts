import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { AUDIO_SYNTH } from '../../../application/ports/audio-synth.port';
import { RECORDER } from '../../../application/ports/recorder.port';
import { HAND_TRACKING } from '../../../application/ports/hand-tracking.port';
import {
  mapPoseToThereminParams,
  smoothParams,
} from '../../../domain/theremin/mapping/map-pose-to-params';
import type {
  HandTrackingFrame,
  ThereminParams,
} from '../../../domain/theremin/models/hand-tracking.model';
import { SettingsStore } from '../../settings/state/settings.store';
import { RecordingsStore } from '../../recordings/state/recordings.store';
import { TranslateService } from '@ngx-translate/core';

type PlayStatus = 'idle' | 'active' | 'error';
type CameraPermission = 'unknown' | 'granted' | 'denied';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const,
  hzToNote = (hz: number): string => {
    if (!Number.isFinite(hz) || hz <= 0) {
      return '--';
    }

    const midi = Math.round(69 + 12 * Math.log2(hz / 440)),
      note = NOTE_NAMES[((midi % 12) + 12) % 12],
      octave = Math.floor(midi / 12) - 1;

    return `${note}${octave}`;
  },
  gainToDb = (gain: number): number => {
    if (!Number.isFinite(gain) || gain <= 0.0001) {
      return -60;
    }

    const db = 20 * Math.log10(gain);
    return Math.round(Math.max(db, -60));
  };

interface PlayState {
  status: PlayStatus;
  permission: CameraPermission;
  isRecording: boolean;
  isTracking: boolean;
  isPreviewOn: boolean;
  hasActivatedOnce: boolean;
  needsAudioUnlock: boolean;
  pitchHz: number;
  gain: number;
  errorMessageKey: string | null;
  lastFrame: HandTrackingFrame | null;
}

const initialState: PlayState = {
  status: 'idle',
  permission: 'unknown',
  isRecording: false,
  isTracking: false,
  isPreviewOn: false,
  hasActivatedOnce: false,
  needsAudioUnlock: false,
  pitchHz: 440,
  gain: 0.2,
  errorMessageKey: null,
  lastFrame: null,
};

export const PlayStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(
    ({
      status,
      permission,
      errorMessageKey,
      isRecording,
      pitchHz,
      gain,
      hasActivatedOnce,
      needsAudioUnlock,
    }) => ({
      isActive: computed(() => status() === 'active'),
      canStart: computed(() => status() !== 'active' && permission() !== 'denied'),
      hasError: computed(() => errorMessageKey() !== null),
      shouldPulseStart: computed(
        () => !hasActivatedOnce() && status() === 'idle' && !needsAudioUnlock(),
      ),
      pitchNoteLabel: computed(() => hzToNote(pitchHz())),
      volumeDb: computed(() => gainToDb(gain())),
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
        isRecording() ? 'PLAY.RECORD_ACTIVE' : 'PLAY.RECORD_IDLE',
      ),
    }),
  ),
  withMethods((store) => {
    const audio = inject(AUDIO_SYNTH),
      recorder = inject(RECORDER),
      tracking = inject(HAND_TRACKING),
      settings = inject(SettingsStore),
      recordings = inject(RecordingsStore),
      translate = inject(TranslateService),
      isDocumentHidden = (): boolean =>
        typeof document !== 'undefined' && document.visibilityState === 'hidden';

    let lastParams: ThereminParams = {
        pitchHz: store.pitchHz(),
        gain: store.gain(),
      },
      lastTimestamp = 0,
      lastUiTimestamp = 0;

    const startAudio = async (): Promise<void> => {
        try {
          await audio.start();
          audio.setPitchHz(store.pitchHz());
          audio.setGain(store.gain());
          patchState(store, { status: 'active', errorMessageKey: null, needsAudioUnlock: false });
        } catch (error) {
          const isGestureError = error instanceof DOMException && error.name === 'NotAllowedError';
          if (isGestureError) {
            patchState(store, {
              status: 'idle',
              needsAudioUnlock: true,
              errorMessageKey: 'PLAY.ERROR_AUDIO_GESTURE',
            });
            return;
          }

          patchState(store, {
            status: 'error',
            errorMessageKey: 'PLAY.ERROR_START_AUDIO',
          });
        }
      },
      saveRecording = (clip: { blob: Blob; mimeType: string; durationMs: number }): void => {
        const id = crypto.randomUUID(),
          durationSeconds = Math.max(1, Math.round(clip.durationMs / 1000)),
          createdAt = new Date(),
          createdAtLabel = new Intl.DateTimeFormat(translate.currentLang || 'es', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
          }).format(createdAt),
          audioUrl = URL.createObjectURL(clip.blob);

        recordings.add(
          {
            id,
            title: translate.instant('RECORDINGS.SESSION_TITLE', { id: id.slice(0, 4) }),
            durationSeconds,
            createdAtLabel,
            createdAtMs: createdAt.getTime(),
            audioUrl,
            mimeType: clip.mimeType,
          },
          clip.blob,
        );
      },
      handleTrackingError = (error: unknown): void => {
        const isPermissionError = error instanceof DOMException && error.name === 'NotAllowedError';
        patchState(store, {
          permission: isPermissionError ? 'denied' : 'unknown',
          isTracking: false,
          status: 'error',
          errorMessageKey: isPermissionError
            ? 'PLAY.ERROR_CAMERA_PERMISSION'
            : 'PLAY.ERROR_HAND_TRACKING',
        });
        audio.stop();
        tracking.stop();
      },
      handleFrame = (frame: HandTrackingFrame): void => {
        const mappingConfig = {
            minHz: settings.minHz(),
            maxHz: settings.maxHz(),
            volumeCurve: settings.volumeCurve(),
            quantize: settings.quantize(),
            swapHands: settings.swapHands(),
            volumeInverted: true,
          },
          nextParams = mapPoseToThereminParams(frame, mappingConfig, lastParams),
          deltaMs = lastTimestamp ? frame.timestampMs - lastTimestamp : 0,
          smoothed = smoothParams(lastParams, nextParams, settings.smoothingMs(), deltaMs);

        lastParams = smoothed;
        lastTimestamp = frame.timestampMs;
        audio.setPitchHz(smoothed.pitchHz);
        audio.setGain(smoothed.gain);

        if (isDocumentHidden()) {
          lastUiTimestamp = frame.timestampMs;
          return;
        }

        const uiIntervalMs = 1000 / 30;
        if (!lastUiTimestamp || frame.timestampMs - lastUiTimestamp >= uiIntervalMs) {
          lastUiTimestamp = frame.timestampMs;
          patchState(store, {
            lastFrame: frame,
            pitchHz: smoothed.pitchHz,
            gain: smoothed.gain,
          });
        }
      },
      startTracking = async (video: HTMLVideoElement): Promise<void> => {
        await tracking.start({
          video,
          onFrame: handleFrame,
          onError: handleTrackingError,
        });

        if (tracking.isRunning()) {
          patchState(store, { permission: 'granted', isTracking: true, isPreviewOn: true });
        }
      };

    return {
      start(video: HTMLVideoElement): void {
        void (async () => {
          patchState(store, { hasActivatedOnce: true });
          await startAudio();
          if (store.status() === 'error') {
            return;
          }

          if (!tracking.isRunning()) {
            await startTracking(video);
          }
        })();
      },
      startPreview(video: HTMLVideoElement): void {
        void startTracking(video);
      },
      stopTracking(): void {
        tracking.stop();
        patchState(store, {
          isTracking: false,
          isPreviewOn: false,
          lastFrame: null,
        });
      },
      setPermission(permission: CameraPermission): void {
        patchState(store, { permission });
      },
      toggleRecording(): void {
        if (store.status() !== 'active') {
          return;
        }

        if (store.isRecording()) {
          void (async () => {
            const clip = await recorder.stop();
            patchState(store, { isRecording: false });
            if (!clip) {
              return;
            }

            saveRecording(clip);
          })();
          return;
        }

        const stream = audio.getOutputStream();
        if (!stream) {
          patchState(store, {
            errorMessageKey: 'PLAY.ERROR_START_AUDIO',
            status: 'error',
          });
          return;
        }

        recorder.start(stream);
        patchState(store, { isRecording: true });
      },
      stop(): void {
        if (store.isRecording()) {
          void (async () => {
            const clip = await recorder.stop();
            patchState(store, { isRecording: false });
            if (clip) {
              saveRecording(clip);
            }
          })();
        }

        audio.stop();
        patchState(store, {
          status: 'idle',
          isRecording: false,
        });
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
          status: errorKey ? 'error' : 'idle',
        });
      },
      clearFrame(): void {
        patchState(store, { lastFrame: null });
      },
    };
  }),
);

export type PlayStore = InstanceType<typeof PlayStore>;
