import type { EnvironmentProviders } from '@angular/core';
import { PLATFORM_ID, inject, makeEnvironmentProviders } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import type { RecorderConfig, RecorderPort } from '../../application/ports/recorder.port';
import { RECORDER, RECORDER_CONFIG } from './tokens/recorder.token';
import { MediaRecorderAdapter, NoopRecorder } from '../../infrastructure/recording/media-recorder';

const defaultConfig: RecorderConfig = {
    mimeType: 'audio/webm;codecs=opus',
    audioBitsPerSecond: 128000,
  },
  createRecorder = (): RecorderPort => {
    const platformId = inject(PLATFORM_ID),
      config = inject(RECORDER_CONFIG);

    if (!isPlatformBrowser(platformId)) {
      return new NoopRecorder();
    }

    return new MediaRecorderAdapter(config);
  };

export const provideRecorder = (overrides: Partial<RecorderConfig> = {}): EnvironmentProviders =>
  makeEnvironmentProviders([
    {
      provide: RECORDER_CONFIG,
      useValue: { ...defaultConfig, ...overrides },
    },
    {
      provide: RECORDER,
      useFactory: createRecorder,
    },
  ]);
