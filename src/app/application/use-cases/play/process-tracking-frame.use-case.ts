import {
  mapPoseToThereminParams,
  type ThereminMappingConfig,
  smoothParams,
} from '../../../domain/theremin/mapping/map-pose-to-params';
import type {
  HandTrackingFrame,
  ThereminParams,
} from '../../../domain/theremin/models/hand-tracking.model';

export interface ProcessTrackingFrameInput {
  frame: HandTrackingFrame;
  mappingConfig: ThereminMappingConfig;
  previousParams: ThereminParams;
  previousTimestampMs: number;
  previousUiTimestampMs: number;
  smoothingMs: number;
  uiFps?: number;
  isDocumentHidden: boolean;
}

export interface ProcessTrackingFrameResult {
  params: ThereminParams;
  timestampMs: number;
  uiTimestampMs: number;
  shouldUpdateUi: boolean;
}

export const processTrackingFrameUseCase = (
  input: ProcessTrackingFrameInput,
): ProcessTrackingFrameResult => {
  const nextParams = mapPoseToThereminParams(
      input.frame,
      input.mappingConfig,
      input.previousParams,
    ),
    deltaMs = input.previousTimestampMs ? input.frame.timestampMs - input.previousTimestampMs : 0,
    smoothed = smoothParams(input.previousParams, nextParams, input.smoothingMs, deltaMs);

  if (input.isDocumentHidden) {
    return {
      params: smoothed,
      timestampMs: input.frame.timestampMs,
      uiTimestampMs: input.frame.timestampMs,
      shouldUpdateUi: false,
    };
  }

  const uiIntervalMs = 1000 / (input.uiFps ?? 30),
    shouldUpdateUi =
      !input.previousUiTimestampMs ||
      input.frame.timestampMs - input.previousUiTimestampMs >= uiIntervalMs;

  return {
    params: smoothed,
    timestampMs: input.frame.timestampMs,
    uiTimestampMs: shouldUpdateUi ? input.frame.timestampMs : input.previousUiTimestampMs,
    shouldUpdateUi,
  };
};
