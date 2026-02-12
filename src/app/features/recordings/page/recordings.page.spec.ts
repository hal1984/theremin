import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CONFIRMATION } from '../../../core/di/tokens/platform.token';
import { RecordingsStore } from '../state/recordings.store';
import { RecordingsPage } from './recordings.page';

interface MockRecordingsStore {
  items: () => unknown[];
  selectedId: () => string | null;
  selected: () => unknown | null;
  isEmpty: () => boolean;
  load: () => Promise<void>;
  select: (id: string | null) => void;
  remove: (id: string) => void;
  clear: () => void;
}

describe('RecordingsPage (ng-mocks providers)', () => {
  let store: MockRecordingsStore;
  let confirmation: { confirm: (message: string) => boolean };
  let translate: { instant: (key: string) => string };
  let component: RecordingsPage;

  beforeEach(() => {
    store = {
      items: vi.fn(() => []),
      selectedId: vi.fn(() => null),
      selected: vi.fn(() => null),
      isEmpty: vi.fn(() => true),
      load: vi.fn(async () => undefined),
      select: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    confirmation = {
      confirm: vi.fn(() => true),
    };

    translate = {
      instant: vi.fn((key: string) => key),
    };

    TestBed.configureTestingModule({
      providers: [
        MockProvider(RecordingsStore, store),
        { provide: CONFIRMATION, useValue: confirmation },
        { provide: TranslateService, useValue: translate },
      ],
    });

    component = TestBed.runInInjectionContext(() => new RecordingsPage());
  });

  it('loads recordings on creation', () => {
    expect(store.load).toHaveBeenCalledTimes(1);
  });

  it('delegates select to the store', () => {
    component.select('id-1');
    expect(store.select).toHaveBeenCalledWith('id-1');
  });

  it('removes a recording when delete is confirmed', () => {
    component.remove('id-2');

    expect(translate.instant).toHaveBeenCalledWith('RECORDINGS.CONFIRM_DELETE');
    expect(confirmation.confirm).toHaveBeenCalledWith('RECORDINGS.CONFIRM_DELETE');
    expect(store.remove).toHaveBeenCalledWith('id-2');
  });

  it('does not remove when delete is canceled', () => {
    (confirmation.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);

    component.remove('id-3');

    expect(store.remove).not.toHaveBeenCalled();
  });

  it('clears recordings when clear is confirmed', () => {
    component.clear();

    expect(translate.instant).toHaveBeenCalledWith('RECORDINGS.CONFIRM_CLEAR');
    expect(confirmation.confirm).toHaveBeenCalledWith('RECORDINGS.CONFIRM_CLEAR');
    expect(store.clear).toHaveBeenCalledTimes(1);
  });

  it('does not clear when clear is canceled', () => {
    (confirmation.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);

    component.clear();

    expect(store.clear).not.toHaveBeenCalled();
  });
});
