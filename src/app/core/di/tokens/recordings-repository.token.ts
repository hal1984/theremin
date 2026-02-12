import { InjectionToken } from '@angular/core';
import type { RecordingsRepositoryPort } from '../../../application/ports/recordings-repository.port';

export const RECORDINGS_REPOSITORY = new InjectionToken<RecordingsRepositoryPort>(
  'RECORDINGS_REPOSITORY',
);
