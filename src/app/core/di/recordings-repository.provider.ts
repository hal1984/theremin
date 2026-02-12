import type { EnvironmentProviders } from '@angular/core';
import { PLATFORM_ID, inject, makeEnvironmentProviders } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { RECORDINGS_REPOSITORY } from './tokens/recordings-repository.token';
import {
  NoopRecordingsRepository,
  RecordingsRepository,
} from '../../infrastructure/recording/recordings.repository';

const createRecordingsRepository = () =>
  isPlatformBrowser(inject(PLATFORM_ID))
    ? new RecordingsRepository()
    : new NoopRecordingsRepository();

export const provideRecordingsRepository = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    {
      provide: RECORDINGS_REPOSITORY,
      useFactory: createRecordingsRepository,
    },
  ]);
