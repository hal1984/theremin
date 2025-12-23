import { EnvironmentProviders, inject, makeEnvironmentProviders, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  RECORDER,
  RECORDER_CONFIG,
  RecorderConfig,
  RecorderPort
} from '../../application/ports/recorder.port';
import { MediaRecorderAdapter, NoopRecorder } from '../../infrastructure/recording/media-recorder';

const defaultConfig: RecorderConfig = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000
};

const createRecorder = (): RecorderPort => {
  const platformId = inject(PLATFORM_ID);
  const config = inject(RECORDER_CONFIG);

  if (!isPlatformBrowser(platformId)) {
    return new NoopRecorder();
  }

  return new MediaRecorderAdapter(config);
};

export const provideRecorder = (
  overrides: Partial<RecorderConfig> = {}
): EnvironmentProviders =>
  makeEnvironmentProviders([
    {
      provide: RECORDER_CONFIG,
      useValue: { ...defaultConfig, ...overrides }
    },
    {
      provide: RECORDER,
      useFactory: createRecorder
    }
  ]);
