import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { TranslateService } from '@ngx-translate/core';

import { startPlaySessionUseCase } from '../../../application/use-cases/play/start-play-session.use-case';
import { stopPlaySessionUseCase } from '../../../application/use-cases/play/stop-play-session.use-case';
import { processTrackingFrameUseCase } from '../../../application/use-cases/play/process-tracking-frame.use-case';
import { toggleRecordingUseCase } from '../../../application/use-cases/play/toggle-recording.use-case';
import type {
  HandTrackingFrame,
  ThereminParams,
} from '../../../domain/theremin/models/hand-tracking.model';
import { HAND_TRACKING } from '../../../core/di/tokens/hand-tracking.token';
import { AUDIO_SYNTH } from '../../../core/di/tokens/audio-synth.token';
import { RECORDER } from '../../../core/di/tokens/recorder.token';
import { CLOCK, OBJECT_URL, UUID } from '../../../core/di/tokens/platform.token';
import { SettingsStore } from '../../settings/state/settings.store';
import { RecordingsStore } from '../../recordings/state/recordings.store';

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
      clock = inject(CLOCK),
      uuid = inject(UUID),
      objectUrl = inject(OBJECT_URL),
      isDocumentHidden = (): boolean =>
        typeof document !== 'undefined' && document.visibilityState === 'hidden',
      recordingTitleBuilder = ({ id }: { id: string }): string =>
        translate.instant('RECORDINGS.SESSION_TITLE', { id: id.slice(0, 4) });

    let lastParams: ThereminParams = {
        pitchHz: store.pitchHz(),
        gain: store.gain(),
      },
      lastTimestamp = 0,
      lastUiTimestamp = 0;

    const handleTrackingError = (error: unknown): void => {
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
        const result = processTrackingFrameUseCase({
          frame,
          mappingConfig: {
            minHz: settings.minHz(),
            maxHz: settings.maxHz(),
            volumeCurve: settings.volumeCurve(),
            quantize: settings.quantize(),
            swapHands: settings.swapHands(),
            volumeInverted: true,
          },
          previousParams: lastParams,
          previousTimestampMs: lastTimestamp,
          previousUiTimestampMs: lastUiTimestamp,
          smoothingMs: settings.smoothingMs(),
          isDocumentHidden: isDocumentHidden(),
          uiFps: 30,
        });

        lastParams = result.params;
        lastTimestamp = result.timestampMs;
        lastUiTimestamp = result.uiTimestampMs;

        audio.setPitchHz(result.params.pitchHz);
        audio.setGain(result.params.gain);

        if (result.shouldUpdateUi) {
          patchState(store, {
            lastFrame: frame,
            pitchHz: result.params.pitchHz,
            gain: result.params.gain,
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

          const audioResult = await startPlaySessionUseCase(audio, store.pitchHz(), store.gain());
          patchState(store, {
            status: audioResult.status,
            errorMessageKey: audioResult.errorMessageKey,
            needsAudioUnlock: audioResult.needsAudioUnlock,
          });

          if (audioResult.status === 'error') {
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

        void (async () => {
          const result = await toggleRecordingUseCase({
            isRecording: store.isRecording(),
            audio,
            recorder,
            locale: translate.currentLang || 'es',
            titleBuilder: recordingTitleBuilder,
            uuid,
            clock,
            objectUrl,
          });

          if (result.type === 'started') {
            patchState(store, { isRecording: true });
            return;
          }

          if (result.type === 'error') {
            patchState(store, {
              errorMessageKey: result.errorMessageKey,
              status: 'error',
            });
            return;
          }

          patchState(store, { isRecording: false });

          if (result.type === 'stopped') {
            recordings.add(result.payload.item, result.payload.blob);
          }
        })();
      },
      stop(): void {
        void (async () => {
          const result = await stopPlaySessionUseCase({
            audio,
            recorder,
            isRecording: store.isRecording(),
            locale: translate.currentLang || 'es',
            titleBuilder: recordingTitleBuilder,
            uuid,
            clock,
            objectUrl,
          });

          patchState(store, {
            status: 'idle',
            isRecording: false,
          });

          if (result.payload) {
            recordings.add(result.payload.item, result.payload.blob);
          }
        })();
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
