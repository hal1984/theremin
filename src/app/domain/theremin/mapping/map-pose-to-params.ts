import type { HandPose, HandTrackingFrame, ThereminParams } from '../models/hand-tracking.model';

export interface ThereminMappingConfig {
  minHz: number;
  maxHz: number;
  volumeCurve: 'linear' | 'expo';
  quantize: boolean;
  swapHands: boolean;
  volumeInverted: boolean;
}

const INDEX_FINGER_TIP = 8,
  clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
  clamp01 = (value: number) => clamp(value, 0, 1),
  remap = (value: number, min: number, max: number) =>
    clamp01((value - min) / Math.max(max - min, 0.0001)),
  logMap = (x: number, minHz: number, maxHz: number) => {
    const ratio = maxHz / minHz;
    return minHz * ratio ** clamp01(x);
  },
  applyQuantize = (hz: number): number => {
    const midi = 69 + 12 * Math.log2(hz / 440),
      rounded = Math.round(midi);
    return 440 * 2 ** ((rounded - 69) / 12);
  },
  getIndexTip = (hand?: HandPose): { x: number; y: number; z?: number } | null => {
    if (!hand) {
      return null;
    }

    const landmark = hand.landmarks[INDEX_FINGER_TIP];
    if (!landmark) {
      return null;
    }

    return { x: landmark.x, y: landmark.y, z: landmark.z };
  },
  pickHand = (hands: readonly HandPose[], handedness: 'Left' | 'Right'): HandPose | undefined =>
    hands.find((hand) => hand.handedness === handedness);

export const mapPoseToThereminParams = (
  frame: HandTrackingFrame,
  config: ThereminMappingConfig,
  previous: ThereminParams,
): ThereminParams => {
  const rightHand = pickHand(frame.hands, 'Right'),
    leftHand = pickHand(frame.hands, 'Left'),
    pitchHand = config.swapHands ? leftHand : rightHand,
    volumeHand = config.swapHands ? rightHand : leftHand,
    fallbackHand = pitchHand ?? volumeHand ?? rightHand ?? leftHand,
    pitchTip = getIndexTip(pitchHand ?? fallbackHand),
    volumeTip = getIndexTip(volumeHand ?? fallbackHand),
    pitchYRaw = pitchTip ? remap(pitchTip.y, 0.2, 0.8) : null,
    pitchYShaped = pitchYRaw !== null ? pitchYRaw ** 0.6 : null,
    pitchY = pitchYShaped !== null ? clamp01(pitchYShaped) : null,
    depthValue = pitchTip?.z ?? null,
    depthMagnitude = depthValue !== null ? Math.abs(depthValue) : null,
    pitchZ = depthMagnitude !== null ? remap(clamp(depthMagnitude, 0, 0.3), 0.015, 0.16) : null,
    pitchNorm =
      pitchY !== null && pitchZ !== null
        ? clamp01(pitchY * 0.5 + pitchZ * 0.5)
        : (pitchY ?? pitchZ),
    nextPitch =
      pitchNorm !== null ? logMap(pitchNorm, config.minHz, config.maxHz) : previous.pitchHz,
    rawGain = volumeTip ? (config.volumeInverted ? volumeTip.y : 1 - volumeTip.y) : 0,
    curve = config.volumeCurve === 'expo' ? 2 : 1,
    nextGain = clamp01(rawGain) ** curve,
    pitchHz = config.quantize ? applyQuantize(nextPitch) : nextPitch;

  return {
    pitchHz: clamp(pitchHz, config.minHz, config.maxHz),
    gain: clamp01(nextGain),
  };
};

export const smoothParams = (
  previous: ThereminParams,
  next: ThereminParams,
  smoothingMs: number,
  deltaMs: number,
): ThereminParams => {
  if (smoothingMs <= 0 || deltaMs <= 0) {
    return next;
  }

  const alpha = 1 - Math.exp(-deltaMs / smoothingMs);

  return {
    pitchHz: previous.pitchHz + (next.pitchHz - previous.pitchHz) * alpha,
    gain: previous.gain + (next.gain - previous.gain) * alpha,
  };
};
