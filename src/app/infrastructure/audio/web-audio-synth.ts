import type {
  AudioSynthConfig,
  AudioSynthPort,
  AudioWaveform,
} from '../../application/ports/audio-synth.port';

interface AudioNodes {
  context: AudioContext;
  oscillator: OscillatorNode;
  shaper: WaveShaperNode;
  formantFilter: BiquadFilterNode;
  toneFilter: BiquadFilterNode;
  gainNode: GainNode;
  recorderDestination: MediaStreamAudioDestinationNode;
  periodicWave: PeriodicWave;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
  createSaturationCurve = (amount: number): Float32Array<ArrayBuffer> => {
    const k = clamp(amount, 0, 1) * 50,
      samples = 1024,
      curve = new Float32Array(new ArrayBuffer(samples * Float32Array.BYTES_PER_ELEMENT));

    for (let i = 0; i < samples; i += 1) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }

    return curve;
  },
  createThereminWave = (context: AudioContext): PeriodicWave => {
    const harmonics = [1, 0.35, 0.22, 0.12, 0.08, 0.05, 0.03, 0.02],
      real = new Float32Array(harmonics.length + 1),
      imag = new Float32Array(harmonics.length + 1);

    harmonics.forEach((amp, index) => {
      imag[index + 1] = amp;
    });

    return context.createPeriodicWave(real, imag, { disableNormalization: true });
  };

export class WebAudioSynth implements AudioSynthPort {
  private nodes: AudioNodes | null = null;
  private started = false;
  private pitchHz: number;
  private gain: number;
  private waveform: AudioWaveform;

  constructor(private readonly config: AudioSynthConfig) {
    this.pitchHz = config.initialPitchHz;
    this.gain = config.initialGain;
    this.waveform = config.waveform;
  }

  async start(): Promise<void> {
    if (!this.nodes) {
      this.nodes = this.createNodes();
    }

    await this.nodes.context.resume();
    this.started = true;
    this.applyPitch(this.pitchHz);
    this.applyGain(this.gain);
  }

  stop(): void {
    if (!this.nodes) {
      return;
    }

    this.started = false;
    this.applyGain(0);
  }

  setPitchHz(hz: number): void {
    const nextValue = clamp(hz, 20, 20000);
    this.pitchHz = nextValue;

    if (this.started) {
      this.applyPitch(nextValue);
    }
  }

  setGain(gain: number): void {
    const nextValue = clamp(gain, 0, 1);
    this.gain = nextValue;

    if (this.started) {
      this.applyGain(nextValue);
    }
  }

  setWaveform(type: AudioWaveform): void {
    this.waveform = type;

    if (!this.nodes) {
      return;
    }

    if (type === 'custom') {
      this.nodes.oscillator.setPeriodicWave(this.nodes.periodicWave);
    } else {
      this.nodes.oscillator.type = type;
    }
  }

  getOutputStream(): MediaStream | null {
    if (!this.nodes) {
      this.nodes = this.createNodes();
    }

    return this.nodes.recorderDestination.stream;
  }

  private createNodes(): AudioNodes {
    const context = new AudioContext({ latencyHint: 'interactive' }),
      oscillator = context.createOscillator(),
      shaper = context.createWaveShaper(),
      formantFilter = context.createBiquadFilter(),
      toneFilter = context.createBiquadFilter(),
      gainNode = context.createGain(),
      recorderDestination = context.createMediaStreamDestination(),
      periodicWave = createThereminWave(context);

    if (this.waveform === 'custom') {
      oscillator.setPeriodicWave(periodicWave);
    } else {
      oscillator.type = this.waveform;
    }

    shaper.curve = createSaturationCurve(0.2);
    shaper.oversample = '2x';

    formantFilter.type = 'peaking';
    formantFilter.frequency.value = 1400;
    formantFilter.Q.value = 1.1;
    formantFilter.gain.value = 3;

    toneFilter.type = 'lowpass';
    toneFilter.frequency.value = 8000;
    toneFilter.Q.value = 0.3;
    gainNode.gain.value = 0;

    oscillator.connect(shaper);
    shaper.connect(formantFilter);
    formantFilter.connect(toneFilter);
    toneFilter.connect(gainNode);
    gainNode.connect(context.destination);
    gainNode.connect(recorderDestination);

    oscillator.start();

    return {
      context,
      oscillator,
      shaper,
      formantFilter,
      toneFilter,
      gainNode,
      recorderDestination,
      periodicWave,
    };
  }

  private applyPitch(value: number): void {
    if (!this.nodes) {
      return;
    }

    const now = this.nodes.context.currentTime,
      smoothing = this.config.pitchSmoothingMs / 1000;

    this.nodes.oscillator.frequency.cancelScheduledValues(now);
    this.nodes.oscillator.frequency.setTargetAtTime(value, now, smoothing || 0.001);
  }

  private applyGain(value: number): void {
    if (!this.nodes) {
      return;
    }

    const now = this.nodes.context.currentTime,
      smoothing = this.config.gainSmoothingMs / 1000;

    this.nodes.gainNode.gain.cancelScheduledValues(now);
    this.nodes.gainNode.gain.setTargetAtTime(value, now, smoothing || 0.001);
  }
}

export class NoopAudioSynth implements AudioSynthPort {
  async start(): Promise<void> {
    void 0;
  }

  stop(): void {
    void 0;
  }

  setPitchHz(): void {
    void 0;
  }

  setGain(): void {
    void 0;
  }

  setWaveform(): void {
    void 0;
  }

  getOutputStream(): MediaStream | null {
    return null;
  }
}
