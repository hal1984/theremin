import { InjectionToken } from '@angular/core';
import { HandTrackingFrame } from '../../domain/theremin/models/hand-tracking.model';

export type HandTrackingConfig = {
  wasmBasePath: string;
  modelAssetPath: string;
  maxHands: number;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  minPresenceConfidence: number;
  targetFps: number;
  videoWidth: number;
  videoHeight: number;
};

export type HandTrackingStartOptions = {
  video: HTMLVideoElement;
  onFrame: (frame: HandTrackingFrame) => void;
  onError?: (error: unknown) => void;
};

export interface HandTrackingPort {
  start(options: HandTrackingStartOptions): Promise<void>;
  stop(): void;
  isRunning(): boolean;
}

export const HAND_TRACKING_CONFIG = new InjectionToken<HandTrackingConfig>('HAND_TRACKING_CONFIG');
export const HAND_TRACKING = new InjectionToken<HandTrackingPort>('HAND_TRACKING');
