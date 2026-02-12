import type { HandTrackingFrame } from '../../domain/theremin/models/hand-tracking.model';

export interface HandTrackingConfig {
  wasmBasePath: string;
  modelAssetPath: string;
  maxHands: number;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  minPresenceConfidence: number;
  targetFps: number;
  videoWidth: number;
  videoHeight: number;
}

export interface HandTrackingStartOptions {
  video: HTMLVideoElement;
  onFrame: (frame: HandTrackingFrame) => void;
  onError?: (error: unknown) => void;
}

export interface HandTrackingPort {
  start: (options: HandTrackingStartOptions) => Promise<void>;
  stop: () => void;
  isRunning: () => boolean;
}
