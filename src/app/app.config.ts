import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAudioSynth } from './core/di/audio-synth.provider';
import { provideI18n } from './core/di/i18n.provider';
import { provideHandLandmarker } from './core/di/hand-tracking.provider';
import { provideRecorder } from './core/di/recorder.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideI18n(),
    provideAudioSynth(),
    provideHandLandmarker(),
    provideRecorder(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode()
    })
  ]
};
