import { describe, expect, it, vi } from 'vitest';
import { MockBuilder, MockRender } from 'ng-mocks';
import { TranslatePipe } from '@ngx-translate/core';

import { PlayActionsComponent } from './actions/play-actions.component';
import { PlayCameraComponent } from './camera/play-camera.component';
import { PlayManualControlsComponent } from './manual-controls/play-manual-controls.component';
import { PlayStatusComponent } from './status/play-status.component';

describe('Play presentation components (render)', () => {
  it('renders status and error blocks', async () => {
    await MockBuilder(PlayStatusComponent).mock(TranslatePipe, (value: string) => value);

    const fixture = MockRender(PlayStatusComponent, {
      statusLabelKey: 'PLAY.STATUS_ACTIVE',
      isActive: false,
      hasError: true,
      errorMessageKey: 'PLAY.ERROR_CAMERA_PERMISSION',
      pitchNoteLabel: 'A4',
      volumeDb: -12,
    });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('PLAY.STATUS_ACTIVE');
    expect(text).toContain('PLAY.ERROR_CAMERA_PERMISSION');
  });

  it('renders actions and emits click events', async () => {
    await MockBuilder(PlayActionsComponent).mock(TranslatePipe, (value: string) => value);

    const fixture = MockRender(PlayActionsComponent, {
      canStart: true,
      isActive: true,
      shouldPulseStart: true,
      recordingLabelKey: 'PLAY.RECORD_IDLE',
    });

    const component = fixture.point.componentInstance;
    const startSpy = vi.fn();
    component.startPressed.subscribe(startSpy);

    const startButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    startButton.click();

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(startButton.className).toContain('joya-pulse');
  });

  it('renders camera and emits ready outputs', async () => {
    await MockBuilder(PlayCameraComponent).mock(TranslatePipe, (value: string) => value);

    const fixture = MockRender(PlayCameraComponent, {
      aspectRatio: 1.5,
    });

    const cameraSpy = vi.fn();
    const overlaySpy = vi.fn();
    const component = fixture.point.componentInstance;
    component.cameraReady.subscribe(cameraSpy);
    component.overlayReady.subscribe(overlaySpy);

    component.ngAfterViewInit();

    expect(fixture.nativeElement.querySelector('video')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('canvas')).toBeTruthy();
    expect(cameraSpy).toHaveBeenCalled();
    expect(overlaySpy).toHaveBeenCalled();
  });

  it('renders manual controls and emits slider changes', async () => {
    await MockBuilder(PlayManualControlsComponent).mock(TranslatePipe, (value: string) => value);

    const fixture = MockRender(PlayManualControlsComponent, {
      pitchValue: 440,
      pitchMin: 40,
      pitchMax: 1000,
      gainValue: 0.2,
      pitchNoteLabel: 'A4',
      volumeDb: -12,
    });

    const component = fixture.point.componentInstance;
    const pitchSpy = vi.fn();
    const gainSpy = vi.fn();
    component.pitchChange.subscribe(pitchSpy);
    component.gainChange.subscribe(gainSpy);

    const sliders = fixture.nativeElement.querySelectorAll(
      'input[type="range"]',
    ) as NodeListOf<HTMLInputElement>;
    sliders[0]!.value = '330';
    sliders[0]!.dispatchEvent(new Event('input'));
    sliders[1]!.value = '0.65';
    sliders[1]!.dispatchEvent(new Event('input'));

    expect(pitchSpy).toHaveBeenCalledWith(330);
    expect(gainSpy).toHaveBeenCalledWith(0.65);
  });
});
