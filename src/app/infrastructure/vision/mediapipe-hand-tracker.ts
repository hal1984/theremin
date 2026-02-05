import type {
  HandTrackingConfig,
  HandTrackingPort,
  HandTrackingStartOptions,
} from '../../application/ports/hand-tracking.port';
import { HAND_TRACKING_CONFIG } from '../../application/ports/hand-tracking.port';
import type {
  HandPose,
  HandTrackingFrame,
  Handedness,
} from '../../domain/theremin/models/hand-tracking.model';
import { inject } from '@angular/core';
import type { HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

const resolveHandedness = (label?: string): Handedness =>
  label?.toLowerCase().includes('left') ? 'Left' : 'Right';

export class MediaPipeHandTracker implements HandTrackingPort {
  private readonly config = inject(HAND_TRACKING_CONFIG);
  private landmarker: HandLandmarker | null = null;
  private tasksModule: typeof import('@mediapipe/tasks-vision') | null = null;
  private running = false;
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private onFrame: ((frame: HandTrackingFrame) => void) | null = null;
  private onError: ((error: unknown) => void) | null = null;

  async start(options: HandTrackingStartOptions): Promise<void> {
    if (this.running) {
      if (this.stream && this.video !== options.video) {
        this.video = options.video;
        this.attachStreamToVideo(this.video, this.stream);
      }
      return;
    }

    this.running = true;
    this.onFrame = options.onFrame;
    this.onError = options.onError ?? null;
    this.video = options.video;

    try {
      await this.ensureLandmarker();
      await this.attachCamera(this.video, this.config);
      await this.waitForVideoReady(this.video);
      this.loop(performance.now());
    } catch (error) {
      this.running = false;
      this.onError?.(error);
    }
  }

  stop(): void {
    this.running = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    this.video = null;
  }

  isRunning(): boolean {
    return this.running;
  }

  private async ensureLandmarker(): Promise<void> {
    if (this.landmarker) {
      return;
    }

    const tasks = await this.loadTasksModule(),
      vision = await tasks.FilesetResolver.forVisionTasks(this.config.wasmBasePath);
    this.landmarker = await tasks.HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: this.config.modelAssetPath,
      },
      runningMode: 'VIDEO',
      numHands: this.config.maxHands,
      minHandDetectionConfidence: this.config.minDetectionConfidence,
      minHandPresenceConfidence: this.config.minPresenceConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence,
    });
  }

  private async loadTasksModule(): Promise<typeof import('@mediapipe/tasks-vision')> {
    if (this.tasksModule) {
      return this.tasksModule;
    }

    this.tasksModule = await import('@mediapipe/tasks-vision');
    return this.tasksModule;
  }

  private async attachCamera(video: HTMLVideoElement, config: HandTrackingConfig): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: config.videoWidth,
        height: config.videoHeight,
        facingMode: 'user',
      },
      audio: false,
    });

    this.stream = stream;
    this.attachStreamToVideo(video, stream);
  }

  private attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream): void {
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.play();
  }

  private readonly loop = (now: number): void => {
    if (!this.running || !this.landmarker || !this.video) {
      return;
    }

    if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }

    const interval = 1000 / this.config.targetFps;
    if (now - this.lastFrameTime < interval) {
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }

    this.lastFrameTime = now;

    try {
      const result = this.landmarker.detectForVideo(this.video, now),
        frame = this.mapResult(result, now);
      this.onFrame?.(frame);
    } catch (error) {
      this.running = false;
      this.onError?.(error);
      return;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private async waitForVideoReady(video: HTMLVideoElement): Promise<void> {
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
          if (resolved) {
            return;
          }
          resolved = true;
          video.removeEventListener('loadedmetadata', done);
          video.removeEventListener('loadeddata', done);
          resolve();
        },
        timeoutId = window.setTimeout(done, 1500),
        finish = () => {
          window.clearTimeout(timeoutId);
          done();
        };

      video.addEventListener('loadedmetadata', finish, { once: true });
      video.addEventListener('loadeddata', finish, { once: true });
    });
  }

  private mapResult(result: HandLandmarkerResult, timestampMs: number): HandTrackingFrame {
    const hands: HandPose[] = result.landmarks.map((landmarks, index) => {
      const handednessEntry = result.handedness?.[index]?.[0],
        label = handednessEntry?.categoryName ?? handednessEntry?.displayName,
        score = handednessEntry?.score ?? 0;

      return {
        handedness: resolveHandedness(label),
        score,
        landmarks,
      };
    });

    return {
      timestampMs,
      hands,
    };
  }
}

export class NoopHandTracker implements HandTrackingPort {
  async start(): Promise<void> {
    void 0;
  }

  stop(): void {
    void 0;
  }

  isRunning(): boolean {
    return false;
  }
}
