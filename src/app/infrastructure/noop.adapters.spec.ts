import { describe, expect, it } from 'vitest';

import { NoopAudioSynth } from './audio/web-audio-synth';
import { NoopRecorder } from './recording/media-recorder';
import { NoopHandTracker } from './vision/mediapipe-hand-tracker';

describe('noop infrastructure adapters', () => {
  it('NoopAudioSynth is callable', async () => {
    const audio = new NoopAudioSynth();

    await audio.start();
    audio.setPitchHz();
    audio.setGain();
    audio.setWaveform();
    audio.stop();

    expect(audio.getOutputStream()).toBeNull();
  });

  it('NoopRecorder behaves as no-op', async () => {
    const recorder = new NoopRecorder();

    recorder.start();
    expect(await recorder.stop()).toBeNull();
    expect(recorder.isRecording()).toBe(false);
  });

  it('NoopHandTracker behaves as no-op', async () => {
    const tracker = new NoopHandTracker();

    await tracker.start();

    expect(tracker.isRunning()).toBe(false);
    tracker.stop();
  });
});
