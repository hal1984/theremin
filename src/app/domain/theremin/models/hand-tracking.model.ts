export type Handedness = 'Left' | 'Right';

export type NormalizedLandmark = {
  x: number;
  y: number;
  z?: number;
};

export type HandPose = {
  handedness: Handedness;
  score: number;
  landmarks: readonly NormalizedLandmark[];
};

export type HandTrackingFrame = {
  timestampMs: number;
  hands: readonly HandPose[];
};

export type ThereminParams = {
  pitchHz: number;
  gain: number;
};
