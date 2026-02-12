import { InjectionToken } from '@angular/core';
import type {
  HandTrackingConfig,
  HandTrackingPort,
} from '../../../application/ports/hand-tracking.port';

export const HAND_TRACKING_CONFIG = new InjectionToken<HandTrackingConfig>('HAND_TRACKING_CONFIG');
export const HAND_TRACKING = new InjectionToken<HandTrackingPort>('HAND_TRACKING');
