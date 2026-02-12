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

  it('reuses running stream and reattaches to a different video', async () => {
    const tracker = TestBed.runInInjectionContext(() => new MediaPipeHandTracker());
    const attachSpy = vi.spyOn(
      tracker as unknown as {
        attachStreamToVideo: (video: HTMLVideoElement, stream: MediaStream) => void;
      },
      'attachStreamToVideo',
    );
    (
      tracker as unknown as { running: boolean; stream: MediaStream; video: HTMLVideoElement }
    ).running = true;
    (
      tracker as unknown as { running: boolean; stream: MediaStream; video: HTMLVideoElement }
    ).stream = {} as MediaStream;
    (
      tracker as unknown as { running: boolean; stream: MediaStream; video: HTMLVideoElement }
    ).video = document.createElement('video');
    const nextVideo = document.createElement('video');

    await tracker.start({
      video: nextVideo,
      onFrame: vi.fn(),
      onError: vi.fn(),
    });

    expect(attachSpy).toHaveBeenCalledWith(nextVideo, expect.anything());
  });

  it('waitForVideoReady resolves when loadedmetadata fires', async () => {
    const tracker = TestBed.runInInjectionContext(() => new MediaPipeHandTracker());
    const waitForVideoReady = (
      tracker as unknown as { waitForVideoReady: (video: HTMLVideoElement) => Promise<void> }
    ).waitForVideoReady;
    const video = document.createElement('video');
    Object.defineProperty(video, 'readyState', { value: 0, configurable: true });
    Object.defineProperty(video, 'videoWidth', { value: 0, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: 0, configurable: true });

    const promise = waitForVideoReady(video);
    video.dispatchEvent(new Event('loadedmetadata'));
    await expect(promise).resolves.toBeUndefined();
  });

  it('ensureLandmarker and loadTasksModule return from cache', async () => {
    const tracker = TestBed.runInInjectionContext(() => new MediaPipeHandTracker());
    (tracker as unknown as { landmarker: object }).landmarker = {};

    await expect(
      (
        tracker as unknown as {
          ensureLandmarker: () => Promise<void>;
        }
      ).ensureLandmarker(),
    ).resolves.toBeUndefined();

    const tasksModule = {} as typeof import('@mediapipe/tasks-vision');
    (tracker as unknown as { tasksModule: typeof import('@mediapipe/tasks-vision') }).tasksModule =
      tasksModule;
    await expect(
      (
        tracker as unknown as {
          loadTasksModule: () => Promise<typeof import('@mediapipe/tasks-vision')>;
        }
      ).loadTasksModule(),
    ).resolves.toBe(tasksModule);
  });

  it('start success path calls ensure, attach, wait and loop', async () => {
    const tracker = TestBed.runInInjectionContext(() => new MediaPipeHandTracker());
    const ensureSpy = vi
      .spyOn(tracker as unknown as { ensureLandmarker: () => Promise<void> }, 'ensureLandmarker')
      .mockResolvedValue(undefined);
    const attachSpy = vi
      .spyOn(
        tracker as unknown as {
          attachCamera: (video: HTMLVideoElement, config: unknown) => Promise<void>;
        },
        'attachCamera',
      )
      .mockResolvedValue(undefined);
    const waitSpy = vi
      .spyOn(
        tracker as unknown as { waitForVideoReady: (video: HTMLVideoElement) => Promise<void> },
        'waitForVideoReady',
      )
      .mockResolvedValue(undefined);
    const loopSpy = vi.spyOn(tracker as unknown as { loop: (now: number) => void }, 'loop');

    await tracker.start({
      video: document.createElement('video'),
      onFrame: vi.fn(),
      onError: vi.fn(),
    });

    expect(ensureSpy).toHaveBeenCalled();
    expect(attachSpy).toHaveBeenCalled();
    expect(waitSpy).toHaveBeenCalled();
    expect(loopSpy).toHaveBeenCalled();
  });

  it('loop throttles when called too early for target fps', () => {
    const tracker = TestBed.runInInjectionContext(() => new MediaPipeHandTracker());
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 2);
    (
      tracker as unknown as {
        running: boolean;
        video: HTMLVideoElement;
        landmarker: { detectForVideo: () => void };
        lastFrameTime: number;
      }
    ).running = true;
    (
      tracker as unknown as {
        running: boolean;
        video: HTMLVideoElement;
        landmarker: { detectForVideo: () => void };
        lastFrameTime: number;
      }
    ).video = { videoWidth: 640, videoHeight: 480 } as HTMLVideoElement;
    const detectSpy = vi.fn();
    (
      tracker as unknown as {
        running: boolean;
        video: HTMLVideoElement;
        landmarker: { detectForVideo: () => void };
        lastFrameTime: number;
      }
    ).landmarker = { detectForVideo: detectSpy };
    (tracker as unknown as { lastFrameTime: number }).lastFrameTime = 995;

    (tracker as unknown as { loop: (now: number) => void }).loop(1000);
    expect(rafSpy).toHaveBeenCalled();
    expect(detectSpy).not.toHaveBeenCalled();
    rafSpy.mockRestore();
  });

  it('noop tracker matches contract', async () => {
    const tracker = new NoopHandTracker();
    await tracker.start();
    tracker.stop();
    expect(tracker.isRunning()).toBe(false);
  });
});
