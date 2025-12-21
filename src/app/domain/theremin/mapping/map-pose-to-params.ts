import { HandPose, HandTrackingFrame, ThereminParams } from '../models/hand-tracking.model';

export type ThereminMappingConfig = {
  minHz: number;
  maxHz: number;
  volumeCurve: 'linear' | 'expo';
  quantize: boolean;
  swapHands: boolean;
  volumeInverted: boolean;
};

const INDEX_FINGER_TIP = 8;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const clamp01 = (value: number) => clamp(value, 0, 1);
const remap = (value: number, min: number, max: number) =>
  clamp01((value - min) / Math.max(max - min, 0.0001));

const logMap = (x: number, minHz: number, maxHz: number) => {
  const ratio = maxHz / minHz;
  return minHz * Math.pow(ratio, clamp01(x));
};

const applyQuantize = (hz: number): number => {
  const midi = 69 + 12 * Math.log2(hz / 440);
  const rounded = Math.round(midi);
  return 440 * Math.pow(2, (rounded - 69) / 12);
};

const getIndexTip = (hand?: HandPose): { x: number; y: number; z?: number } | null => {
  if (!hand) {
    return null;
  }

  const landmark = hand.landmarks[INDEX_FINGER_TIP];
  if (!landmark) {
    return null;
  }

  return { x: landmark.x, y: landmark.y, z: landmark.z };
};

const pickHand = (
  hands: readonly HandPose[],
  handedness: 'Left' | 'Right'
): HandPose | undefined => hands.find((hand) => hand.handedness === handedness);

export const mapPoseToThereminParams = (
  frame: HandTrackingFrame,
  config: ThereminMappingConfig,
  previous: ThereminParams
): ThereminParams => {
  const rightHand = pickHand(frame.hands, 'Right');
  const leftHand = pickHand(frame.hands, 'Left');
  const pitchHand = config.swapHands ? leftHand : rightHand;
  const volumeHand = config.swapHands ? rightHand : leftHand;

  const fallbackHand = pitchHand ?? volumeHand ?? rightHand ?? leftHand;
  const pitchTip = getIndexTip(pitchHand ?? fallbackHand);
  const volumeTip = getIndexTip(volumeHand ?? fallbackHand);

  const pitchYRaw = pitchTip ? remap(pitchTip.y, 0.2, 0.8) : null;
  const pitchYShaped = pitchYRaw !== null ? Math.pow(pitchYRaw, 0.6) : null;
  const pitchY = pitchYShaped !== null ? clamp01(pitchYShaped) : null;
  const depthValue = pitchTip?.z ?? null;
  const depthMagnitude = depthValue !== null ? Math.abs(depthValue) : null;
  const pitchZ =
    depthMagnitude !== null
      ? remap(clamp(depthMagnitude, 0, 0.3), 0.015, 0.16)
      : null;
  const pitchNorm =
    pitchY !== null && pitchZ !== null
      ? clamp01(pitchY * 0.5 + pitchZ * 0.5)
      : pitchY ?? pitchZ;
  const nextPitch = pitchNorm !== null
    ? logMap(pitchNorm, config.minHz, config.maxHz)
    : previous.pitchHz;
  const rawGain = volumeTip ? (config.volumeInverted ? volumeTip.y : 1 - volumeTip.y) : 0;
  const curve = config.volumeCurve === 'expo' ? 2 : 1;
  const nextGain = Math.pow(clamp01(rawGain), curve);

  const pitchHz = config.quantize ? applyQuantize(nextPitch) : nextPitch;

  return {
    pitchHz: clamp(pitchHz, config.minHz, config.maxHz),
    gain: clamp01(nextGain)
  };
};

export const smoothParams = (
  previous: ThereminParams,
  next: ThereminParams,
  smoothingMs: number,
  deltaMs: number
): ThereminParams => {
  if (smoothingMs <= 0 || deltaMs <= 0) {
    return next;
  }

  const alpha = 1 - Math.exp(-deltaMs / smoothingMs);

  return {
    pitchHz: previous.pitchHz + (next.pitchHz - previous.pitchHz) * alpha,
    gain: previous.gain + (next.gain - previous.gain) * alpha
  };
};
