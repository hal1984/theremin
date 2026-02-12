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
