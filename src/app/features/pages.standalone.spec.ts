import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { MockProvider } from 'ng-mocks';

import { CONFIRMATION, OBJECT_URL } from '../core/di/tokens/platform.token';
import { RECORDINGS_REPOSITORY } from '../core/di/tokens/recordings-repository.token';
import { AboutPage } from './about/page/about.page';
import { RecordingsPage } from './recordings/page/recordings.page';
import { RecordingsStore } from './recordings/state/recordings.store';
import { SettingsPage } from './settings/page/settings.page';
import { SettingsStore } from './settings/state/settings.store';

describe('Standalone pages (class tests)', () => {
  it('creates AboutPage', () => {
    expect(new AboutPage()).toBeTruthy();
  });

  describe('SettingsPage', () => {
    it('interacts with SettingsStore', () => {
      TestBed.configureTestingModule({
        providers: [
          MockProvider(SettingsStore, {
            minHz: () => 40,
            maxHz: () => 800,
            smoothingMs: () => 24,
            setRange: vi.fn(),
            setSmoothing: vi.fn(),
            toggleSwapHands: vi.fn(),
            toggleQuantize: vi.fn(),
          } as unknown as SettingsStore),
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });

      const page = TestBed.runInInjectionContext(() => new SettingsPage());
      page.toggleSwapHands();
      page.toggleQuantize();

      const store = TestBed.inject(SettingsStore);
      expect(store.toggleSwapHands).toHaveBeenCalledTimes(1);
      expect(store.toggleQuantize).toHaveBeenCalledTimes(1);
    });
  });

  describe('RecordingsPage', () => {
    const confirmation = { confirm: vi.fn(() => true) };

    beforeEach(() => {
      confirmation.confirm.mockClear();
      TestBed.configureTestingModule({
        providers: [
          MockProvider(RecordingsStore, {
            load: vi.fn().mockResolvedValue(undefined),
            select: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          } as unknown as RecordingsStore),
          {
            provide: CONFIRMATION,
            useValue: confirmation,
          },
          {
            provide: RECORDINGS_REPOSITORY,
            useValue: {
              getAll: vi.fn(async () => []),
              put: vi.fn(async () => undefined),
              remove: vi.fn(async () => undefined),
              clear: vi.fn(async () => undefined),
            },
          },
          {
            provide: OBJECT_URL,
            useValue: {
              create: vi.fn(() => 'blob:test'),
              revoke: vi.fn(),
            },
          },
          {
            provide: TranslateService,
            useValue: {
              instant: vi.fn((key: string) => key),
            },
          },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
    });

    it('loads and clears recordings via store + confirmation', () => {
      const page = TestBed.runInInjectionContext(() => new RecordingsPage());
      const store = TestBed.inject(RecordingsStore);

      page.clear();

      expect(store.load).toHaveBeenCalled();
      expect(confirmation.confirm).toHaveBeenCalled();
      expect(store.clear).toHaveBeenCalled();
    });
  });
});
