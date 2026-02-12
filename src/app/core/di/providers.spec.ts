import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it } from 'vitest';

import { provideAudioSynth } from './audio-synth.provider';
import { provideHandLandmarker } from './hand-tracking.provider';
import { providePlatformPorts } from './platform.provider';
import { provideRecorder } from './recorder.provider';
import { provideRecordingsRepository } from './recordings-repository.provider';
import { AUDIO_SYNTH } from './tokens/audio-synth.token';
import { HAND_TRACKING } from './tokens/hand-tracking.token';
import { CLOCK, CONFIRMATION, OBJECT_URL, UUID } from './tokens/platform.token';
import { RECORDER } from './tokens/recorder.token';
import { RECORDINGS_REPOSITORY } from './tokens/recordings-repository.token';

describe('core providers', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        providePlatformPorts(),
        provideRecordingsRepository(),
        provideAudioSynth(),
        provideHandLandmarker(),
        provideRecorder(),
      ],
    });
  });

  it('provides platform tokens', () => {
    expect(TestBed.inject(CONFIRMATION)).toBeTruthy();
    expect(TestBed.inject(CLOCK)).toBeTruthy();
    expect(TestBed.inject(UUID)).toBeTruthy();
    expect(TestBed.inject(OBJECT_URL)).toBeTruthy();
  });

  it('provides feature tokens on browser', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        providePlatformPorts(),
        provideRecordingsRepository(),
        provideAudioSynth(),
        provideHandLandmarker(),
        provideRecorder(),
      ],
    });

    expect(TestBed.inject(RECORDINGS_REPOSITORY)).toBeTruthy();
    expect(TestBed.inject(AUDIO_SYNTH)).toBeTruthy();
    expect(TestBed.inject(HAND_TRACKING)).toBeTruthy();
    expect(TestBed.inject(RECORDER)).toBeTruthy();
  });

  it('provides feature tokens on server', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        providePlatformPorts(),
        provideRecordingsRepository(),
        provideAudioSynth(),
        provideHandLandmarker(),
        provideRecorder(),
      ],
    });

    expect(TestBed.inject(RECORDINGS_REPOSITORY)).toBeTruthy();
    expect(TestBed.inject(AUDIO_SYNTH)).toBeTruthy();
    expect(TestBed.inject(HAND_TRACKING)).toBeTruthy();
    expect(TestBed.inject(RECORDER)).toBeTruthy();
  });
});
