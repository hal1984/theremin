import { describe, expect, it } from 'vitest';

import type {
  HandTrackingFrame,
  ThereminParams,
} from '../../../domain/theremin/models/hand-tracking.model';
import { processTrackingFrameUseCase } from './process-tracking-frame.use-case';

const makeFrame = (timestampMs: number): HandTrackingFrame => ({
  timestampMs,
  hands: [
    {
      handedness: 'Right',
      score: 0.95,
      landmarks: Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 })),
    },
    {
      handedness: 'Left',
      score: 0.95,
      landmarks: Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.4, z: 0 })),
    },
  ],
});

describe('processTrackingFrameUseCase', () => {
  const previousParams: ThereminParams = { pitchHz: 440, gain: 0.2 };

  it('skips UI updates while document is hidden', () => {
    const result = processTrackingFrameUseCase({
      frame: makeFrame(1000),
      mappingConfig: {
        minHz: 40,
        maxHz: 600,
        volumeCurve: 'expo',
        quantize: false,
        swapHands: false,
        volumeInverted: true,
      },
      previousParams,
      previousTimestampMs: 950,
      previousUiTimestampMs: 950,
      smoothingMs: 40,
      isDocumentHidden: true,
      uiFps: 30,
    });

    expect(result.shouldUpdateUi).toBe(false);
    expect(result.uiTimestampMs).toBe(1000);
  });

  it('throttles UI updates to target FPS', () => {
    const result = processTrackingFrameUseCase({
      frame: makeFrame(1010),
      mappingConfig: {
        minHz: 40,
        maxHz: 600,
        volumeCurve: 'expo',
        quantize: false,
        swapHands: false,
        volumeInverted: true,
      },
      previousParams,
      previousTimestampMs: 1000,
      previousUiTimestampMs: 1000,
      smoothingMs: 40,
      isDocumentHidden: false,
      uiFps: 30,
    });

    expect(result.shouldUpdateUi).toBe(false);
    expect(result.uiTimestampMs).toBe(1000);
  });
});
