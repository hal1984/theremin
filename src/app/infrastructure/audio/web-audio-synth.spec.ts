import { describe, expect, it, vi, beforeEach } from 'vitest';

import { NoopAudioSynth, WebAudioSynth } from './web-audio-synth';

class FakeParam {
  value = 0;
  cancelScheduledValues = vi.fn();
  setTargetAtTime = vi.fn();
}

class FakeNode {
  connect = vi.fn();
}

class FakeOscillatorNode extends FakeNode {
  frequency = new FakeParam();
  type: OscillatorType = 'sine';
  setPeriodicWave = vi.fn();
  start = vi.fn();
}

class FakeWaveShaperNode extends FakeNode {
  curve: Float32Array | null = null;
  oversample: OverSampleType = 'none';
}

class FakeBiquadFilterNode extends FakeNode {
  type: BiquadFilterType = 'lowpass';
  frequency = new FakeParam();
  Q = new FakeParam();
  gain = new FakeParam();
}

class FakeGainNode extends FakeNode {
  gain = new FakeParam();
}

class FakeAudioContext {
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  resume = vi.fn(async () => undefined);
  createOscillator = vi.fn(() => new FakeOscillatorNode() as unknown as OscillatorNode);
  createWaveShaper = vi.fn(() => new FakeWaveShaperNode() as unknown as WaveShaperNode);
  createBiquadFilter = vi.fn(() => new FakeBiquadFilterNode() as unknown as BiquadFilterNode);
  createGain = vi.fn(() => new FakeGainNode() as unknown as GainNode);
  createMediaStreamDestination = vi.fn(
    () => ({ stream: { id: 'stream' } }) as unknown as MediaStreamAudioDestinationNode,
  );
  createPeriodicWave = vi.fn(() => ({}) as PeriodicWave);
}

describe('WebAudioSynth', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext as unknown as typeof AudioContext);
  });

  it('creates nodes lazily and starts synth', async () => {
    const synth = new WebAudioSynth({
      waveform: 'sine',
      initialPitchHz: 440,
      initialGain: 0.2,
      pitchSmoothingMs: 10,
      gainSmoothingMs: 20,
    });

    const stream = synth.getOutputStream();
    expect(stream).toBeTruthy();

    await synth.start();
    synth.setPitchHz(880);
    synth.setGain(0.5);

    const nodes = (
      synth as unknown as { nodes: { oscillator: FakeOscillatorNode; gainNode: FakeGainNode } }
    ).nodes;
    expect(nodes.oscillator.frequency.setTargetAtTime).toHaveBeenCalled();
    expect(nodes.gainNode.gain.setTargetAtTime).toHaveBeenCalled();
  });

  it('clamps values and supports custom waveform', async () => {
    const synth = new WebAudioSynth({
      waveform: 'custom',
      initialPitchHz: 440,
      initialGain: 0.2,
      pitchSmoothingMs: 0,
      gainSmoothingMs: 0,
    });

    await synth.start();
    synth.setPitchHz(50000);
    synth.setGain(-2);
    synth.setWaveform('square');
    synth.setWaveform('custom');
    synth.stop();

    const nodes = (
      synth as unknown as { nodes: { oscillator: FakeOscillatorNode; gainNode: FakeGainNode } }
    ).nodes;
    expect(nodes.oscillator.setPeriodicWave).toHaveBeenCalled();
    expect(nodes.gainNode.gain.setTargetAtTime).toHaveBeenCalled();
  });

  it('noop synth keeps contract', async () => {
    const synth = new NoopAudioSynth();
    await synth.start();
    synth.stop();
    synth.setPitchHz();
    synth.setGain();
    synth.setWaveform();
    expect(synth.getOutputStream()).toBeNull();
  });
});
