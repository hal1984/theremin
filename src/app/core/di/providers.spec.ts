import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it } from 'vitest';

import { providePlatformPorts } from './platform.provider';
import { provideRecordingsRepository } from './recordings-repository.provider';
import { CLOCK, CONFIRMATION, OBJECT_URL, UUID } from './tokens/platform.token';
import { RECORDINGS_REPOSITORY } from './tokens/recordings-repository.token';

describe('core providers', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [providePlatformPorts(), provideRecordingsRepository()],
    });
  });

  it('provides platform tokens', () => {
    expect(TestBed.inject(CONFIRMATION)).toBeTruthy();
    expect(TestBed.inject(CLOCK)).toBeTruthy();
    expect(TestBed.inject(UUID)).toBeTruthy();
    expect(TestBed.inject(OBJECT_URL)).toBeTruthy();
  });

  it('provides recordings repository token', () => {
    expect(TestBed.inject(RECORDINGS_REPOSITORY)).toBeTruthy();
  });
});
