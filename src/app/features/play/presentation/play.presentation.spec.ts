import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { PlayActionsComponent } from './actions/play-actions.component';
import { PlayCameraComponent } from './camera/play-camera.component';
import { PlayManualControlsComponent } from './manual-controls/play-manual-controls.component';
import { PlayStatusComponent } from './status/play-status.component';

describe('Play presentation components (class tests)', () => {
  it('creates PlayStatusComponent', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new PlayStatusComponent());
    expect(component).toBeTruthy();
  });

  it('PlayActionsComponent emits actions', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new PlayActionsComponent());
    const startSpy = vi.fn();
    const stopSpy = vi.fn();
    const recordSpy = vi.fn();

    component.startPressed.subscribe(startSpy);
    component.stopPressed.subscribe(stopSpy);
    component.recordPressed.subscribe(recordSpy);

    component.startPressed.emit();
    component.stopPressed.emit();
    component.recordPressed.emit();

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(recordSpy).toHaveBeenCalledTimes(1);
  });

  it('PlayManualControlsComponent emits pitch and gain updates', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new PlayManualControlsComponent());
    const pitchSpy = vi.fn();
    const gainSpy = vi.fn();

    component.pitchChange.subscribe(pitchSpy);
    component.gainChange.subscribe(gainSpy);

    component.onPitchInput({ target: { value: '220' } } as unknown as Event);
    component.onGainInput({ target: { value: '0.5' } } as unknown as Event);

    expect(pitchSpy).toHaveBeenCalledWith(220);
    expect(gainSpy).toHaveBeenCalledWith(0.5);
  });

  it('PlayCameraComponent has default aspect ratio', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new PlayCameraComponent());
    expect(component.aspectRatio()).toBeCloseTo(16 / 9);
  });
});
