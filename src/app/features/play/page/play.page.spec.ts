import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { MockProvider } from 'ng-mocks';

import { PlayPage } from './play.page';
import { PlayStore } from '../state/play.store';
import { SettingsStore } from '../../settings/state/settings.store';
import { ThereminOverlayRenderer } from '../presentation/overlay/theremin-overlay.renderer';

interface MockPlayStore {
  statusLabelKey: () => string;
  isActive: () => boolean;
  hasError: () => boolean;
  errorMessageKey: () => string | null;
  pitchNoteLabel: () => string;
  volumeDb: () => number;
  pitchHz: () => number;
  gain: () => number;
  canStart: () => boolean;
  shouldPulseStart: () => boolean;
  recordingLabelKey: () => string;
  lastFrame: () => null;
  startPreview: (video: HTMLVideoElement) => void;
  start: (video: HTMLVideoElement) => void;
  setError: (key: string) => void;
  stop: () => void;
  toggleRecording: () => void;
  setPitch: (value: number) => void;
  setGain: (value: number) => void;
  stopTracking: () => void;
}

describe('PlayPage (ng-mocks providers)', () => {
  let store: MockPlayStore;
  let component: PlayPage;

  beforeEach(() => {
    store = {
      statusLabelKey: vi.fn(() => 'PLAY.STATUS_READY'),
      isActive: vi.fn(() => false),
      hasError: vi.fn(() => false),
      errorMessageKey: vi.fn(() => null),
      pitchNoteLabel: vi.fn(() => 'A4'),
      volumeDb: vi.fn(() => -12),
      pitchHz: vi.fn(() => 440),
      gain: vi.fn(() => 0.2),
      canStart: vi.fn(() => true),
      shouldPulseStart: vi.fn(() => false),
      recordingLabelKey: vi.fn(() => 'PLAY.RECORD_IDLE'),
      lastFrame: vi.fn(() => null),
      startPreview: vi.fn(),
      start: vi.fn(),
      setError: vi.fn(),
      stop: vi.fn(),
      toggleRecording: vi.fn(),
      setPitch: vi.fn(),
      setGain: vi.fn(),
      stopTracking: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        MockProvider(PlayStore, store),
        MockProvider(SettingsStore, {
          minHz: () => 40,
          maxHz: () => 600,
        }),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    component = TestBed.runInInjectionContext(() => new PlayPage());
  });

  it('sets error if start is requested without camera', () => {
    component.start();

    expect(store.setError).toHaveBeenCalledWith('PLAY.ERROR_CAMERA_UNAVAILABLE');
    expect(store.start).not.toHaveBeenCalled();
  });

  it('primes camera and starts preview when camera is ready', () => {
    const video = {
      videoWidth: 200,
      videoHeight: 100,
      autoplay: false,
      muted: false,
      playsInline: false,
      setAttribute: vi.fn(),
      addEventListener: vi.fn(),
    } as unknown as HTMLVideoElement;

    component.onCameraReady(video);

    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.setAttribute).toHaveBeenCalledWith('muted', '');
    expect(video.setAttribute).toHaveBeenCalledWith('playsinline', '');
    expect(store.startPreview).toHaveBeenCalledWith(video);
    expect(component.cameraAspect()).toBe(2);
  });

  it('starts playback when camera exists', () => {
    const video = {
      videoWidth: 120,
      videoHeight: 60,
      autoplay: false,
      muted: false,
      playsInline: false,
      setAttribute: vi.fn(),
      addEventListener: vi.fn(),
    } as unknown as HTMLVideoElement;

    component.onCameraReady(video);
    component.start();

    expect(store.start).toHaveBeenCalledWith(video);
  });

  it('delegates stop and clears overlay', () => {
    const clearSpy = vi.spyOn(ThereminOverlayRenderer.prototype, 'clear');
    const canvas = {
      getContext: vi.fn(() => ({ clearRect: vi.fn() })),
      width: 100,
      height: 100,
    } as unknown as HTMLCanvasElement;

    component.onOverlayReady(canvas);
    clearSpy.mockClear();
    component.stop();

    expect(store.stop).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalled();

    clearSpy.mockRestore();
  });

  it('delegates recording, pitch, gain and destroy actions', () => {
    component.toggleRecording();
    component.setPitch(330);
    component.setGain(0.7);
    component.ngOnDestroy();

    expect(store.toggleRecording).toHaveBeenCalledTimes(1);
    expect(store.setPitch).toHaveBeenCalledWith(330);
    expect(store.setGain).toHaveBeenCalledWith(0.7);
    expect(store.stopTracking).toHaveBeenCalledTimes(1);
  });

  it('does not start preview when platform is server', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        MockProvider(PlayStore, store),
        MockProvider(SettingsStore, {
          minHz: () => 40,
          maxHz: () => 600,
        }),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverComponent = TestBed.runInInjectionContext(() => new PlayPage());
    const video = {
      videoWidth: 200,
      videoHeight: 100,
      setAttribute: vi.fn(),
      addEventListener: vi.fn(),
    } as unknown as HTMLVideoElement;

    serverComponent.onCameraReady(video);
    serverComponent.start();

    expect(store.startPreview).not.toHaveBeenCalled();
    expect(store.start).not.toHaveBeenCalled();
    expect(store.setError).toHaveBeenCalledWith('PLAY.ERROR_CAMERA_UNAVAILABLE');
  });

  it('drawOverlay respects document visibility', () => {
    const drawSpy = vi.spyOn(ThereminOverlayRenderer.prototype, 'draw');
    const frame = { timestampMs: 1, hands: [] };
    const canvas = document.createElement('canvas');
    const video = document.createElement('video');
    const originalVisibility = Object.getOwnPropertyDescriptor(document, 'visibilityState');

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    (
      component as unknown as {
        drawOverlay: (
          frameArg: { timestampMs: number; hands: unknown[] },
          canvasArg: HTMLCanvasElement,
          videoArg: HTMLVideoElement,
        ) => void;
      }
    ).drawOverlay(frame, canvas, video);
    expect(drawSpy).not.toHaveBeenCalled();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    (
      component as unknown as {
        drawOverlay: (
          frameArg: { timestampMs: number; hands: unknown[] },
          canvasArg: HTMLCanvasElement,
          videoArg: HTMLVideoElement,
        ) => void;
      }
    ).drawOverlay(frame, canvas, video);
    expect(drawSpy).toHaveBeenCalled();

    if (originalVisibility) {
      Object.defineProperty(document, 'visibilityState', originalVisibility);
    }
    drawSpy.mockRestore();
  });
});
