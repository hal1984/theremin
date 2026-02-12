export type AudioWaveform = OscillatorType;

export interface AudioSynthConfig {
  waveform: AudioWaveform;
  initialPitchHz: number;
  initialGain: number;
  pitchSmoothingMs: number;
  gainSmoothingMs: number;
}

export interface AudioSynthPort {
  start: () => Promise<void>;
  stop: () => void;
  setPitchHz: (hz: number) => void;
  setGain: (gain: number) => void;
  setWaveform: (type: AudioWaveform) => void;
  getOutputStream: () => MediaStream | null;
}
