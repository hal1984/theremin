import { InjectionToken } from '@angular/core';

export type AudioWaveform = OscillatorType;

export type AudioSynthConfig = {
  waveform: AudioWaveform;
  initialPitchHz: number;
  initialGain: number;
  pitchSmoothingMs: number;
  gainSmoothingMs: number;
};

export const AUDIO_SYNTH_CONFIG = new InjectionToken<AudioSynthConfig>('AUDIO_SYNTH_CONFIG');

export interface AudioSynthPort {
  start(): Promise<void>;
  stop(): void;
  setPitchHz(hz: number): void;
  setGain(gain: number): void;
  setWaveform(type: AudioWaveform): void;
}

export const AUDIO_SYNTH = new InjectionToken<AudioSynthPort>('AUDIO_SYNTH');
