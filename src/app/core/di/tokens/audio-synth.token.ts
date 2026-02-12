import { InjectionToken } from '@angular/core';
import type { AudioSynthConfig, AudioSynthPort } from '../../../application/ports/audio-synth.port';

export const AUDIO_SYNTH_CONFIG = new InjectionToken<AudioSynthConfig>('AUDIO_SYNTH_CONFIG');
export const AUDIO_SYNTH = new InjectionToken<AudioSynthPort>('AUDIO_SYNTH');
