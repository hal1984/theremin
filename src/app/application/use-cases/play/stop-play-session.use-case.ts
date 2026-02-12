import type { RecordingItem } from '../../models/recording.model';
import type { AudioSynthPort } from '../../ports/audio-synth.port';
import type { ClockPort } from '../../ports/clock.port';
import type { ObjectUrlPort } from '../../ports/object-url.port';
import type { RecorderPort } from '../../ports/recorder.port';
import type { UuidPort } from '../../ports/uuid.port';
import { createRecordingPayloadFromClip } from './toggle-recording.use-case';

interface RecordingLabelInput {
  id: string;
}

interface StopPlaySessionInput {
  audio: AudioSynthPort;
  recorder: RecorderPort;
  isRecording: boolean;
  locale: string;
  titleBuilder: (input: RecordingLabelInput) => string;
  uuid: UuidPort;
  clock: ClockPort;
  objectUrl: ObjectUrlPort;
}

export interface StopPlaySessionResult {
  payload: { item: RecordingItem; blob: Blob } | null;
}

export const stopPlaySessionUseCase = async (
  input: StopPlaySessionInput,
): Promise<StopPlaySessionResult> => {
  input.audio.stop();

  if (!input.isRecording) {
    return { payload: null };
  }

  const clip = await input.recorder.stop();
  if (!clip) {
    return { payload: null };
  }

  return {
    payload: createRecordingPayloadFromClip({
      clip,
      locale: input.locale,
      titleBuilder: input.titleBuilder,
      uuid: input.uuid,
      clock: input.clock,
      objectUrl: input.objectUrl,
    }),
  };
};
