import { describe, expect, it } from 'vitest';

import {
  type ThereminMappingConfig,
  mapPoseToThereminParams,
  smoothParams,
} from './map-pose-to-params';
import type { HandTrackingFrame, ThereminParams } from '../models/hand-tracking.model';

const makeLandmarks = (overrides: Partial<{ x: number; y: number; z: number }> = {}) => {
    const base = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    base[8] = { x: overrides.x ?? 0.5, y: overrides.y ?? 0.5, z: overrides.z ?? 0 };
    return base;
  },
  makeFrame = (
    params: {
      right?: Partial<{ x: number; y: number; z: number }>;
      left?: Partial<{ x: number; y: number; z: number }>;
    } = {},
  ): HandTrackingFrame => {
    const hands = [];
    if (params.right) {
      hands.push({
        handedness: 'Right' as const,
        score: 0.9,
        landmarks: makeLandmarks(params.right),
      });
    }
    if (params.left) {
      hands.push({
        handedness: 'Left' as const,
        score: 0.9,
        landmarks: makeLandmarks(params.left),
      });
    }
    return { timestampMs: 1000, hands };
  },
  baseConfig: ThereminMappingConfig = {
    minHz: 80,
    maxHz: 800,
    volumeCurve: 'linear',
    quantize: false,
    swapHands: false,
    volumeInverted: true,
  };

describe('mapPoseToThereminParams', () => {
  it('keeps previous pitch and returns 0 gain when no hands are present', () => {
    const previous: ThereminParams = { pitchHz: 440, gain: 0.2 },
      frame = makeFrame(),
      next = mapPoseToThereminParams(frame, baseConfig, previous);
    expect(next.pitchHz).toBe(previous.pitchHz);
    expect(next.gain).toBe(0);
  });

  it('clamps pitch and gain into valid ranges', () => {
    const previous: ThereminParams = { pitchHz: 440, gain: 0.2 },
      frame = makeFrame({
        right: { y: -10, z: 10 }, // Extreme values, should still clamp
        left: { y: 10 },
      }),
      config: ThereminMappingConfig = { ...baseConfig, minHz: 120, maxHz: 240 },
      next = mapPoseToThereminParams(frame, config, previous);
    expect(next.pitchHz).toBeGreaterThanOrEqual(config.minHz);
    expect(next.pitchHz).toBeLessThanOrEqual(config.maxHz);
    expect(next.gain).toBeGreaterThanOrEqual(0);
    expect(next.gain).toBeLessThanOrEqual(1);
  });

  it('quantize=true snaps the computed pitch to the nearest semitone', () => {
    const previous: ThereminParams = { pitchHz: 440, gain: 0.2 },
      frame = makeFrame({
        right: { y: 0.42, z: 0.05 },
        left: { y: 0.22 },
      }),
      unquantized = mapPoseToThereminParams(frame, { ...baseConfig, quantize: false }, previous),
      quantized = mapPoseToThereminParams(frame, { ...baseConfig, quantize: true }, previous),
      midi = 69 + 12 * Math.log2(unquantized.pitchHz / 440),
      expected = 440 * 2 ** ((Math.round(midi) - 69) / 12);

    expect(quantized.pitchHz).toBeCloseTo(expected, 8);
  });
});

describe('smoothParams', () => {
  it('returns next when smoothingMs<=0 or deltaMs<=0', () => {
    const prev: ThereminParams = { pitchHz: 100, gain: 0.1 },
      next: ThereminParams = { pitchHz: 200, gain: 0.9 };
    expect(smoothParams(prev, next, 0, 16)).toEqual(next);
    expect(smoothParams(prev, next, 40, 0)).toEqual(next);
  });

  it('moves monotonically from previous toward next', () => {
    const prev: ThereminParams = { pitchHz: 100, gain: 0.1 },
      next: ThereminParams = { pitchHz: 200, gain: 0.9 },
      smoothed = smoothParams(prev, next, 40, 16);
    expect(smoothed.pitchHz).toBeGreaterThan(prev.pitchHz);
    expect(smoothed.pitchHz).toBeLessThan(next.pitchHz);
    expect(smoothed.gain).toBeGreaterThan(prev.gain);
    expect(smoothed.gain).toBeLessThan(next.gain);
  });
});
