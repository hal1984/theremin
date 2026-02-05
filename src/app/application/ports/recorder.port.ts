import { InjectionToken } from '@angular/core';

export interface RecorderConfig {
  mimeType?: string;
  audioBitsPerSecond?: number;
}

export interface RecordedClip {
  blob: Blob;
  mimeType: string;
  durationMs: number;
}

export interface RecorderPort {
  start: (stream: MediaStream) => void;
  stop: () => Promise<RecordedClip | null>;
  isRecording: () => boolean;
}

export const RECORDER_CONFIG = new InjectionToken<RecorderConfig>('RECORDER_CONFIG');
export const RECORDER = new InjectionToken<RecorderPort>('RECORDER');
