import { describe, expect, it, vi } from 'vitest';

import { startPlaySessionUseCase } from './start-play-session.use-case';
import { stopPlaySessionUseCase } from './stop-play-session.use-case';

describe('start/stop play session use-cases', () => {
  it('starts audio and returns active state', async () => {
    const audio = {
      start: vi.fn(async () => undefined),
      stop: vi.fn(),
      setPitchHz: vi.fn(),
      setGain: vi.fn(),
      setWaveform: vi.fn(),
      getOutputStream: vi.fn(() => null),
    };

    const result = await startPlaySessionUseCase(audio, 440, 0.4);

    expect(result).toEqual({
      status: 'active',
      errorMessageKey: null,
      needsAudioUnlock: false,
    });
    expect(audio.setPitchHz).toHaveBeenCalledWith(440);
    expect(audio.setGain).toHaveBeenCalledWith(0.4);
  });

  it('returns gesture error for NotAllowedError', async () => {
    const audio = {
      start: vi.fn(async () => {
        throw new DOMException('blocked', 'NotAllowedError');
      }),
      stop: vi.fn(),
      setPitchHz: vi.fn(),
      setGain: vi.fn(),
      setWaveform: vi.fn(),
      getOutputStream: vi.fn(() => null),
    };

    const result = await startPlaySessionUseCase(audio, 440, 0.4);

    expect(result).toEqual({
      status: 'idle',
      needsAudioUnlock: true,
      errorMessageKey: 'PLAY.ERROR_AUDIO_GESTURE',
    });
  });

  it('stops without payload when recorder is idle', async () => {
    const result = await stopPlaySessionUseCase({
      audio: {
        start: vi.fn(async () => undefined),
        stop: vi.fn(),
        setPitchHz: vi.fn(),
        setGain: vi.fn(),
        setWaveform: vi.fn(),
        getOutputStream: vi.fn(() => null),
      },
      recorder: {
        start: vi.fn(),
        stop: vi.fn(async () => null),
        isRecording: vi.fn(() => false),
      },
      isRecording: false,
      locale: 'es',
      titleBuilder: ({ id }) => id,
      uuid: { generate: vi.fn(() => 'id-1') },
      clock: {
        now: vi.fn(() => new Date('2026-01-01T00:00:00.000Z')),
        formatShortDateTime: vi.fn(() => '01/01 00:00'),
      },
      objectUrl: {
        create: vi.fn(() => 'blob:id-1'),
        revoke: vi.fn(),
      },
    });

    expect(result.payload).toBeNull();
  });
});
