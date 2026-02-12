import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HAND_TRACKING_CONFIG } from '../../core/di/tokens/hand-tracking.token';
import { MediaPipeHandTracker, NoopHandTracker } from './mediapipe-hand-tracker';

describe('MediaPipeHandTracker', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HAND_TRACKING_CONFIG,
          useValue: {
            wasmBasePath: '/wasm',
            modelAssetPath: '/model.task',
            maxHands: 2,
            minDetectionConfidence: 0.5,
            minPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            targetFps: 30,
            videoWidth: 640,
            videoHeight: 480,
          },
        },
      ],
    });
  });

  it('maps handedness labels and timestamp', () => {
    const tracker = TestBed.runInInjectionContext(() => new MediaPipeHandTracker());
    const mapResult = (
      tracker as unknown as {
        mapResult: (
          r: unknown,
          t: number,
        ) => { hands: { handedness: string }[]; timestampMs: number };
      }
    ).mapResult;

    const mapped = mapResult(
      {
        landmarks: [[{ x: 0.1, y: 0.2, z: 0 }]],
        handedness: [[{ categoryName: 'left', score: 0.9 }]],
      },
      100,
    );

    expect(mapped.timestampMs).toBe(100);
    expect(mapped.hands[0]?.handedness).toBe('Left');
  });

  it('stop cancels raf and media tracks', () => {
    const tracker = TestBed.runInInjectionContext(() => new MediaPipeHandTracker());
    const stopTrack = vi.fn();
    const cancelRaf = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);

    (
      tracker as unknown as {
        running: boolean;
        rafId: number | null;
        stream: MediaStream;
        video: HTMLVideoElement;
      }
    ).running = true;
    (
      tracker as unknown as {
        running: boolean;
        rafId: number | null;
        stream: MediaStream;
        video: HTMLVideoElement;
      }
    ).rafId = 2;
    (
      tracker as unknown as {
        running: boolean;
        rafId: number | null;
        stream: MediaStream;
        video: HTMLVideoElement;
      }
    ).stream = {
      getTracks: () => [{ stop: stopTrack } as unknown as MediaStreamTrack],
    } as MediaStream;
    (
      tracker as unknown as {
        running: boolean;
        rafId: number | null;
        stream: MediaStream;
        video: HTMLVideoElement;
      }
    ).video = {
      srcObject: {} as MediaProvider,
    } as HTMLVideoElement;

    tracker.stop();

    expect(cancelRaf).toHaveBeenCalledWith(2);
    expect(stopTrack).toHaveBeenCalled();
    expect(tracker.isRunning()).toBe(false);
    cancelRaf.mockRestore();
  });

  it('start reports permission error', async () => {
    const tracker = TestBed.runInInjectionContext(() => new MediaPipeHandTracker());
    const onError = vi.fn();
    const startInner = vi.spyOn(
      tracker as unknown as { ensureLandmarker: () => Promise<void> },
      'ensureLandmarker',
    );
    startInner.mockRejectedValue(new DOMException('nope', 'NotAllowedError'));

    await tracker.start({
      video: document.createElement('video'),
      onFrame: vi.fn(),
      onError,
    });

    expect(onError).toHaveBeenCalled();
    expect(tracker.isRunning()).toBe(false);
    startInner.mockRestore();
  });

  it('waitForVideoReady resolves immediately when dimensions exist', async () => {
    const tracker = TestBed.runInInjectionContext(() => new MediaPipeHandTracker());
    const waitForVideoReady = (
      tracker as unknown as { waitForVideoReady: (video: HTMLVideoElement) => Promise<void> }
    ).waitForVideoReady;

    const video = {
      readyState: 3,
      videoWidth: 640,
      videoHeight: 480,
    } as HTMLVideoElement;

    await expect(waitForVideoReady(video)).resolves.toBeUndefined();
  });

  it('loop handles no video size and detect errors', () => {
    const tracker = TestBed.runInInjectionContext(() => new MediaPipeHandTracker());
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);

    (
      tracker as unknown as {
        running: boolean;
        video: HTMLVideoElement;
        landmarker: { detectForVideo: () => void };
        onError: (error: unknown) => void;
        lastFrameTime: number;
      }
    ).running = true;
    (
      tracker as unknown as {
        running: boolean;
        video: HTMLVideoElement;
        landmarker: { detectForVideo: () => void };
        onError: (error: unknown) => void;
        lastFrameTime: number;
      }
    ).video = { videoWidth: 0, videoHeight: 0 } as HTMLVideoElement;
    (
      tracker as unknown as {
        running: boolean;
        video: HTMLVideoElement;
        landmarker: { detectForVideo: () => void };
        onError: (error: unknown) => void;
        lastFrameTime: number;
      }
    ).landmarker = { detectForVideo: vi.fn() };

    (
      tracker as unknown as {
        loop: (now: number) => void;
      }
    ).loop(1);
    expect(rafSpy).toHaveBeenCalled();

    (
      tracker as unknown as {
        running: boolean;
        video: HTMLVideoElement;
        landmarker: { detectForVideo: () => void };
        onError: (error: unknown) => void;
        lastFrameTime: number;
      }
    ).video = { videoWidth: 640, videoHeight: 480 } as HTMLVideoElement;
    (
      tracker as unknown as {
        running: boolean;
        video: HTMLVideoElement;
        landmarker: { detectForVideo: () => void };
        onError: (error: unknown) => void;
        lastFrameTime: number;
      }
    ).landmarker = {
      detectForVideo: () => {
        throw new Error('detect failed');
      },
    };
    const errorSpy = vi.fn();
    (tracker as unknown as { onError: (error: unknown) => void }).onError = errorSpy;
    (tracker as unknown as { lastFrameTime: number }).lastFrameTime = 0;

    (tracker as unknown as { loop: (now: number) => void }).loop(1000);
    expect(errorSpy).toHaveBeenCalled();

    rafSpy.mockRestore();
  });

  it('noop tracker matches contract', async () => {
    const tracker = new NoopHandTracker();
    await tracker.start();
    tracker.stop();
    expect(tracker.isRunning()).toBe(false);
  });
});
