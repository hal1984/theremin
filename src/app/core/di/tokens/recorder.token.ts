import { InjectionToken } from '@angular/core';
import type { RecorderConfig, RecorderPort } from '../../../application/ports/recorder.port';

export const RECORDER_CONFIG = new InjectionToken<RecorderConfig>('RECORDER_CONFIG');
export const RECORDER = new InjectionToken<RecorderPort>('RECORDER');
