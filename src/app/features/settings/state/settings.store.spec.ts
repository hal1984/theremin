import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it } from 'vitest';

import { SettingsStore } from './settings.store';

describe('SettingsStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('updates range and smoothing', () => {
    const store = TestBed.inject(SettingsStore);

    store.setRange(50, 700);
    store.setSmoothing(80);

    expect(store.minHz()).toBe(50);
    expect(store.maxHz()).toBe(700);
    expect(store.smoothingMs()).toBe(80);
  });

  it('toggles settings flags', () => {
    const store = TestBed.inject(SettingsStore);
    const initialSwap = store.swapHands();
    const initialQuantize = store.quantize();

    store.toggleSwapHands();
    store.toggleQuantize();

    expect(store.swapHands()).toBe(!initialSwap);
    expect(store.quantize()).toBe(!initialQuantize);
  });
});
