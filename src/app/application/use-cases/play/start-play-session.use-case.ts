import type { AudioSynthPort } from '../../ports/audio-synth.port';

export interface StartPlaySessionResult {
  status: 'active' | 'idle' | 'error';
  errorMessageKey: string | null;
  needsAudioUnlock: boolean;
}

export const startPlaySessionUseCase = async (
  audio: AudioSynthPort,
  pitchHz: number,
  gain: number,
): Promise<StartPlaySessionResult> => {
  try {
    await audio.start();
    audio.setPitchHz(pitchHz);
    audio.setGain(gain);

    return {
      status: 'active',
      errorMessageKey: null,
      needsAudioUnlock: false,
    };
  } catch (error) {
    const isGestureError = error instanceof DOMException && error.name === 'NotAllowedError';
    if (isGestureError) {
      return {
        status: 'idle',
        needsAudioUnlock: true,
        errorMessageKey: 'PLAY.ERROR_AUDIO_GESTURE',
      };
    }

    return {
      status: 'error',
      needsAudioUnlock: false,
      errorMessageKey: 'PLAY.ERROR_START_AUDIO',
    };
  }
};
