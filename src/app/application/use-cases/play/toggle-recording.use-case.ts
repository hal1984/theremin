import type { RecordingItem } from '../../models/recording.model';
import type { AudioSynthPort } from '../../ports/audio-synth.port';
import type { ClockPort } from '../../ports/clock.port';
import type { ObjectUrlPort } from '../../ports/object-url.port';
import type { RecordedClip, RecorderPort } from '../../ports/recorder.port';
import type { UuidPort } from '../../ports/uuid.port';

interface RecordingLabelInput {
  id: string;
}

interface CreateRecordingItemInput {
  clip: RecordedClip;
  locale: string;
  titleBuilder: (input: RecordingLabelInput) => string;
  uuid: UuidPort;
  clock: ClockPort;
  objectUrl: ObjectUrlPort;
}

interface RecordingPayload {
  item: RecordingItem;
  blob: Blob;
}

export type ToggleRecordingResult =
  | { type: 'started' }
  | { type: 'stopped-empty' }
  | { type: 'stopped'; payload: RecordingPayload }
  | { type: 'error'; errorMessageKey: string };

export interface ToggleRecordingInput {
  isRecording: boolean;
  audio: AudioSynthPort;
  recorder: RecorderPort;
  locale: string;
  titleBuilder: (input: RecordingLabelInput) => string;
  uuid: UuidPort;
  clock: ClockPort;
  objectUrl: ObjectUrlPort;
}

export const createRecordingPayloadFromClip = (
  input: CreateRecordingItemInput,
): RecordingPayload => {
  const id = input.uuid.generate(),
    durationSeconds = Math.max(1, Math.round(input.clip.durationMs / 1000)),
    createdAt = input.clock.now(),
    createdAtLabel = input.clock.formatShortDateTime(createdAt, input.locale);

  return {
    item: {
      id,
      title: input.titleBuilder({ id }),
      durationSeconds,
      createdAtLabel,
      createdAtMs: createdAt.getTime(),
      audioUrl: input.objectUrl.create(input.clip.blob),
      mimeType: input.clip.mimeType,
    },
    blob: input.clip.blob,
  };
};

export const toggleRecordingUseCase = async (
  input: ToggleRecordingInput,
): Promise<ToggleRecordingResult> => {
  if (input.isRecording) {
    const clip = await input.recorder.stop();
    if (!clip) {
      return { type: 'stopped-empty' };
    }

    return {
      type: 'stopped',
      payload: createRecordingPayloadFromClip({
        clip,
        locale: input.locale,
        titleBuilder: input.titleBuilder,
        uuid: input.uuid,
        clock: input.clock,
        objectUrl: input.objectUrl,
      }),
    };
  }

  const stream = input.audio.getOutputStream();
  if (!stream) {
    return {
      type: 'error',
      errorMessageKey: 'PLAY.ERROR_START_AUDIO',
    };
  }

  input.recorder.start(stream);
  return { type: 'started' };
};
