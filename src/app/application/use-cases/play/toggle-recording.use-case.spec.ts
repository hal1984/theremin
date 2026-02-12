import { describe, expect, it, vi } from 'vitest';

import type { AudioSynthPort } from '../../ports/audio-synth.port';
import type { ClockPort } from '../../ports/clock.port';
import type { ObjectUrlPort } from '../../ports/object-url.port';
import type { RecorderPort } from '../../ports/recorder.port';
import type { UuidPort } from '../../ports/uuid.port';
import { toggleRecordingUseCase } from './toggle-recording.use-case';

describe('toggleRecordingUseCase', () => {
  const baseDependencies = () => {
    const audio: AudioSynthPort = {
        start: vi.fn(async () => undefined),
        stop: vi.fn(),
        setPitchHz: vi.fn(),
        setGain: vi.fn(),
        setWaveform: vi.fn(),
        getOutputStream: vi.fn(() => ({}) as MediaStream),
      },
      recorder: RecorderPort = {
        start: vi.fn(),
        stop: vi.fn(async () => null),
        isRecording: vi.fn(() => false),
      },
      uuid: UuidPort = {
        generate: vi.fn(() => 'abcd-1234-efgh'),
      },
      clock: ClockPort = {
        now: vi.fn(() => new Date('2026-02-12T12:00:00.000Z')),
        formatShortDateTime: vi.fn(() => '12/02 12:00'),
      },
      objectUrl: ObjectUrlPort = {
        create: vi.fn(() => 'blob:test'),
        revoke: vi.fn(),
      };

    return { audio, recorder, uuid, clock, objectUrl };
  };

  it('starts recording when stream is available', async () => {
    const deps = baseDependencies();

    const result = await toggleRecordingUseCase({
      isRecording: false,
      audio: deps.audio,
      recorder: deps.recorder,
      locale: 'es',
      titleBuilder: ({ id }) => `Sesion ${id}`,
      uuid: deps.uuid,
      clock: deps.clock,
      objectUrl: deps.objectUrl,
    });

    expect(result).toEqual({ type: 'started' });
    expect(deps.recorder.start).toHaveBeenCalledTimes(1);
  });

  it('returns an error when no output stream is available', async () => {
    const deps = baseDependencies();
    vi.mocked(deps.audio.getOutputStream).mockReturnValue(null);

    const result = await toggleRecordingUseCase({
      isRecording: false,
      audio: deps.audio,
      recorder: deps.recorder,
      locale: 'es',
      titleBuilder: ({ id }) => `Sesion ${id}`,
      uuid: deps.uuid,
      clock: deps.clock,
      objectUrl: deps.objectUrl,
    });

    expect(result).toEqual({
      type: 'error',
      errorMessageKey: 'PLAY.ERROR_START_AUDIO',
    });
  });

  it('creates a recording payload when stopping a recording', async () => {
    const deps = baseDependencies();
    vi.mocked(deps.recorder.stop).mockResolvedValue({
      blob: new Blob(['audio'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
      durationMs: 2460,
    });

    const result = await toggleRecordingUseCase({
      isRecording: true,
      audio: deps.audio,
      recorder: deps.recorder,
      locale: 'es',
      titleBuilder: ({ id }) => `Sesion ${id.slice(0, 4)}`,
      uuid: deps.uuid,
      clock: deps.clock,
      objectUrl: deps.objectUrl,
    });

    expect(result.type).toBe('stopped');
    if (result.type === 'stopped') {
      expect(result.payload.item.id).toBe('abcd-1234-efgh');
      expect(result.payload.item.audioUrl).toBe('blob:test');
      expect(result.payload.item.durationSeconds).toBe(2);
      expect(result.payload.item.createdAtLabel).toBe('12/02 12:00');
    }
  });
});
