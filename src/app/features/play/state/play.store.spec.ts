import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { TranslateService } from '@ngx-translate/core';

import { AUDIO_SYNTH } from '../../../core/di/tokens/audio-synth.token';
import { HAND_TRACKING } from '../../../core/di/tokens/hand-tracking.token';
import { CLOCK, OBJECT_URL, UUID } from '../../../core/di/tokens/platform.token';
import { RECORDER } from '../../../core/di/tokens/recorder.token';
import { RECORDINGS_REPOSITORY } from '../../../core/di/tokens/recordings-repository.token';
import { PlayStore } from './play.store';

const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('PlayStore', () => {
  let trackingRunning = false;

  const audio = {
      start: vi.fn(async () => undefined),
      stop: vi.fn(),
      setPitchHz: vi.fn(),
      setGain: vi.fn(),
      setWaveform: vi.fn(),
      getOutputStream: vi.fn(() => ({}) as MediaStream),
    },
    recorder = {
      start: vi.fn(),
      stop: vi.fn(async () => ({
        blob: new Blob(['audio'], { type: 'audio/webm' }),
        mimeType: 'audio/webm',
        durationMs: 1500,
      })),
      isRecording: vi.fn(() => false),
    },
    handTracking = {
      start: vi.fn(async () => {
        trackingRunning = true;
      }),
      stop: vi.fn(() => {
        trackingRunning = false;
      }),
      isRunning: vi.fn(() => trackingRunning),
    },
    clock = {
      now: vi.fn(() => new Date('2026-02-12T12:00:00.000Z')),
      formatShortDateTime: vi.fn(() => '12/02 12:00'),
    },
    uuid = {
      generate: vi.fn(() => 'play-store-uuid'),
    },
    objectUrl = {
      create: vi.fn(() => 'blob:play-store'),
      revoke: vi.fn(),
    },
    recordingsRepository = {
      getAll: vi.fn(async () => []),
      put: vi.fn(async () => undefined),
      remove: vi.fn(async () => undefined),
      clear: vi.fn(async () => undefined),
    },
    translate = {
      currentLang: 'es',
      instant: vi.fn((_key: string, values?: { id: string }) => `Sesion ${values?.id ?? ''}`),
    };

  beforeEach(() => {
    trackingRunning = false;
    Object.values(audio).forEach((mock) => {
      if (typeof mock === 'function' && 'mockReset' in mock) {
        mock.mockReset();
      }
    });
    audio.start.mockResolvedValue(undefined);
    audio.getOutputStream.mockReturnValue({} as MediaStream);

    recorder.start.mockReset();
    recorder.stop.mockReset();
    recorder.stop.mockResolvedValue({
      blob: new Blob(['audio'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
      durationMs: 1500,
    });

    handTracking.start.mockReset();
    handTracking.stop.mockReset();
    handTracking.isRunning.mockImplementation(() => trackingRunning);

    clock.now.mockReset();
    clock.now.mockReturnValue(new Date('2026-02-12T12:00:00.000Z'));
    clock.formatShortDateTime.mockReset();
    clock.formatShortDateTime.mockReturnValue('12/02 12:00');

    uuid.generate.mockReset();
    uuid.generate.mockReturnValue('play-store-uuid');

    objectUrl.create.mockReset();
    objectUrl.create.mockReturnValue('blob:play-store');
    objectUrl.revoke.mockReset();

    recordingsRepository.getAll.mockReset();
    recordingsRepository.getAll.mockResolvedValue([]);
    recordingsRepository.put.mockReset();
    recordingsRepository.remove.mockReset();
    recordingsRepository.clear.mockReset();

    translate.instant.mockReset();
    translate.instant.mockImplementation(
      (_key: string, values?: { id: string }) => `Sesion ${values?.id ?? ''}`,
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: AUDIO_SYNTH, useValue: audio },
        { provide: RECORDER, useValue: recorder },
        { provide: HAND_TRACKING, useValue: handTracking },
        { provide: CLOCK, useValue: clock },
        { provide: UUID, useValue: uuid },
        { provide: OBJECT_URL, useValue: objectUrl },
        { provide: RECORDINGS_REPOSITORY, useValue: recordingsRepository },
        { provide: TranslateService, useValue: translate },
      ],
    });
  });

  it('uses platform ports when stopping a recording', async () => {
    const store = TestBed.inject(PlayStore),
      video = {} as HTMLVideoElement;

    store.start(video);
    await flush();

    store.toggleRecording();
    await flush();

    store.toggleRecording();
    await flush();

    expect(uuid.generate).toHaveBeenCalledTimes(1);
    expect(clock.now).toHaveBeenCalledTimes(1);
    expect(objectUrl.create).toHaveBeenCalledTimes(1);
    expect(recordingsRepository.put).toHaveBeenCalledTimes(1);
  });
});
