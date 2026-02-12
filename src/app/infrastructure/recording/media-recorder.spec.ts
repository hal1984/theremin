import { describe, expect, it, vi, beforeEach } from 'vitest';

import { MediaRecorderAdapter, NoopRecorder } from './media-recorder';

class FakeMediaRecorder {
  static isTypeSupported = vi.fn((type: string) => type.includes('webm'));

  mimeType = 'audio/webm';
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  start = vi.fn(() => undefined);
  stop = vi.fn(() => {
    this.onstop?.();
  });
}

describe('MediaRecorderAdapter', () => {
  beforeEach(() => {
    FakeMediaRecorder.isTypeSupported.mockReset();
    FakeMediaRecorder.isTypeSupported.mockImplementation((type: string) => type.includes('webm'));
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder as unknown as typeof MediaRecorder);
  });

  it('starts and stops with generated clip', async () => {
    const perf = vi.spyOn(performance, 'now');
    perf.mockReturnValueOnce(100).mockReturnValueOnce(1300);

    const adapter = new MediaRecorderAdapter({
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000,
    });
    adapter.start({} as MediaStream);

    const state = (adapter as unknown as { state: { recorder: FakeMediaRecorder; chunks: Blob[] } })
      .state;
    state?.recorder.ondataavailable?.({
      data: new Blob(['chunk'], { type: 'audio/webm' }),
    } as BlobEvent);

    const clip = await adapter.stop();
    expect(clip?.durationMs).toBe(1200);
    expect(adapter.isRecording()).toBe(false);

    perf.mockRestore();
  });

  it('returns null when stopping without active recorder', async () => {
    const adapter = new MediaRecorderAdapter({ mimeType: 'audio/ogg', audioBitsPerSecond: 128000 });
    await expect(adapter.stop()).resolves.toBeNull();
  });

  it('ignores second start when already recording', () => {
    const adapter = new MediaRecorderAdapter({
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000,
    });
    adapter.start({} as MediaStream);
    adapter.start({} as MediaStream);

    const state = (adapter as unknown as { state: { recorder: FakeMediaRecorder } | null }).state;
    expect(state?.recorder.start).toHaveBeenCalledTimes(1);
  });

  it('falls back mime type when preferred and candidates are unsupported', async () => {
    FakeMediaRecorder.isTypeSupported.mockImplementation(() => false);
    const adapter = new MediaRecorderAdapter({
      mimeType: 'audio/not-supported',
      audioBitsPerSecond: 128000,
    });

    adapter.start({} as MediaStream);
    const state = (adapter as unknown as { state: { recorder: FakeMediaRecorder; chunks: Blob[] } })
      .state;
    if (state) {
      state.recorder.mimeType = '';
      state.recorder.ondataavailable?.({
        data: new Blob([], { type: 'audio/not-supported' }),
      } as BlobEvent);
    }

    const clip = await adapter.stop();
    expect(clip?.mimeType).toBe('audio/webm');
  });

  it('noop recorder contract', async () => {
    const recorder = new NoopRecorder();
    recorder.start();
    expect(await recorder.stop()).toBeNull();
    expect(recorder.isRecording()).toBe(false);
  });
});
