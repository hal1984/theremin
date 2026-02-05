import { EnvironmentProviders, inject, makeEnvironmentProviders, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  HAND_TRACKING,
  HAND_TRACKING_CONFIG,
  HandTrackingConfig,
  HandTrackingPort
} from '../../application/ports/hand-tracking.port';
import { MediaPipeHandTracker, NoopHandTracker } from '../../infrastructure/vision/mediapipe-hand-tracker';

const defaultConfig: HandTrackingConfig = {
  wasmBasePath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm',
  modelAssetPath:
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  maxHands: 2,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6,
  minPresenceConfidence: 0.6,
  targetFps: 30,
  videoWidth: 1280,
  videoHeight: 720
};

const createHandTracking = (): HandTrackingPort => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return new NoopHandTracker();
  }

  return new MediaPipeHandTracker();
};

export const provideHandLandmarker = (
  overrides: Partial<HandTrackingConfig> = {}
): EnvironmentProviders =>
  makeEnvironmentProviders([
    {
      provide: HAND_TRACKING_CONFIG,
      useValue: { ...defaultConfig, ...overrides }
    },
    {
      provide: HAND_TRACKING,
      useFactory: createHandTracking
    }
  ]);
