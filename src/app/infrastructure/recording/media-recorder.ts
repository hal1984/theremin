import type {
  RecordedClip,
  RecorderConfig,
  RecorderPort,
} from '../../application/ports/recorder.port';

interface RecorderState {
  recorder: MediaRecorder;
  chunks: Blob[];
  startedAt: number;
  mimeType: string;
}

const resolveMimeType = (preferred?: string): string => {
  if (preferred && MediaRecorder.isTypeSupported(preferred)) {
    return preferred;
  }

  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
};

export class MediaRecorderAdapter implements RecorderPort {
  private state: RecorderState | null = null;

  constructor(private readonly config: RecorderConfig) {}

  start(stream: MediaStream): void {
    if (this.state) {
      return;
    }

    const mimeType = resolveMimeType(this.config.mimeType),
      recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: this.config.audioBitsPerSecond,
      }),
      chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.start();
    this.state = {
      recorder,
      chunks,
      startedAt: performance.now(),
      mimeType: mimeType || recorder.mimeType || 'audio/webm',
    };
  }

  async stop(): Promise<RecordedClip | null> {
    if (!this.state) {
      return null;
    }

    const { recorder, chunks, startedAt, mimeType } = this.state;
    this.state = null;

    return new Promise<RecordedClip>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType }),
          durationMs = Math.max(0, performance.now() - startedAt);
        resolve({ blob, mimeType, durationMs });
      };

      recorder.stop();
    });
  }

  isRecording(): boolean {
    return this.state !== null;
  }
}

export class NoopRecorder implements RecorderPort {
  start(): void {}

  async stop(): Promise<RecordedClip | null> {
    return null;
  }

  isRecording(): boolean {
    return false;
  }
}
