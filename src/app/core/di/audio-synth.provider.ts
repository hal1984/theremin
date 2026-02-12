import type { EnvironmentProviders } from '@angular/core';
import { PLATFORM_ID, inject, makeEnvironmentProviders } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import type { AudioSynthConfig, AudioSynthPort } from '../../application/ports/audio-synth.port';
import { AUDIO_SYNTH, AUDIO_SYNTH_CONFIG } from './tokens/audio-synth.token';
import { NoopAudioSynth, WebAudioSynth } from '../../infrastructure/audio/web-audio-synth';

const defaultConfig: AudioSynthConfig = {
    waveform: 'custom',
    initialPitchHz: 440,
    initialGain: 0.2,
    pitchSmoothingMs: 24,
    gainSmoothingMs: 32,
  },
  createAudioSynth = (): AudioSynthPort => {
    const platformId = inject(PLATFORM_ID),
      config = inject(AUDIO_SYNTH_CONFIG);

    if (!isPlatformBrowser(platformId)) {
      return new NoopAudioSynth();
    }

    return new WebAudioSynth(config);
  };

export const provideAudioSynth = (
  overrides: Partial<AudioSynthConfig> = {},
): EnvironmentProviders =>
  makeEnvironmentProviders([
    {
      provide: AUDIO_SYNTH_CONFIG,
      useValue: { ...defaultConfig, ...overrides },
    },
    {
      provide: AUDIO_SYNTH,
      useFactory: createAudioSynth,
    },
  ]);
