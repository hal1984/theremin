export type Handedness = 'Left' | 'Right';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface HandPose {
  handedness: Handedness;
  score: number;
  landmarks: readonly NormalizedLandmark[];
}

export interface HandTrackingFrame {
  timestampMs: number;
  hands: readonly HandPose[];
}

export interface ThereminParams {
  pitchHz: number;
  gain: number;
}
