import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsStore } from '../state/settings.store';
import { SettingsPage } from './settings.page';

interface MockSettingsStore {
  minHz: () => number;
  maxHz: () => number;
  smoothingMs: () => number;
  setRange: (minHz: number, maxHz: number) => void;
  setSmoothing: (value: number) => void;
  toggleSwapHands: () => void;
  toggleQuantize: () => void;
}

describe('SettingsPage (ng-mocks providers)', () => {
  let store: MockSettingsStore;
  let component: SettingsPage;

  beforeEach(() => {
    store = {
      minHz: vi.fn(() => 40),
      maxHz: vi.fn(() => 600),
      smoothingMs: vi.fn(() => 20),
      setRange: vi.fn(),
      setSmoothing: vi.fn(),
      toggleSwapHands: vi.fn(),
      toggleQuantize: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [MockProvider(SettingsStore, store)],
    });

    component = TestBed.runInInjectionContext(() => new SettingsPage());
  });

  it('nudges range using current values', () => {
    component.nudgeRange(10);
    expect(store.setRange).toHaveBeenCalledWith(50, 610);
  });

  it('clamps min range to 20 and keeps at least 40Hz gap', () => {
    (store.minHz as ReturnType<typeof vi.fn>).mockReturnValue(25);
    (store.maxHz as ReturnType<typeof vi.fn>).mockReturnValue(50);

    component.nudgeRange(-20);

    expect(store.setRange).toHaveBeenCalledWith(20, 60);
  });

  it('nudges smoothing and clamps to 0', () => {
    component.nudgeSmoothing(-10);
    expect(store.setSmoothing).toHaveBeenCalledWith(10);

    (store.smoothingMs as ReturnType<typeof vi.fn>).mockReturnValue(5);
    component.nudgeSmoothing(-20);
    expect(store.setSmoothing).toHaveBeenLastCalledWith(0);
  });

  it('delegates swap-hands and quantize toggles', () => {
    component.toggleSwapHands();
    component.toggleQuantize();

    expect(store.toggleSwapHands).toHaveBeenCalledTimes(1);
    expect(store.toggleQuantize).toHaveBeenCalledTimes(1);
  });
});
