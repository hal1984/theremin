import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PlayStore } from './state/play.store';

@Component({
  selector: 'app-play-page',
  template: `
    <section class="flex flex-col gap-6">
      <header class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Modo tocar</p>
        <h1 class="text-3xl font-semibold text-slate-900">Theremin en vivo</h1>
        <p class="text-base text-slate-600">
          Activa la camara para empezar. También puedes usar el modo accesible con sliders.
        </p>
      </header>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Estado</p>
          <p class="mt-2 text-xl font-semibold text-slate-900" aria-live="polite">
            {{ store.statusLabel() }}
          </p>
          @if (store.errorMessage()) {
            <p class="mt-2 text-sm text-red-600" role="alert">{{ store.errorMessage() }}</p>
          }
          <p class="mt-3 text-sm text-slate-500">
            Pitch: {{ store.pitchHz() }} Hz · Volumen: {{ store.gain() }}
          </p>
        </div>

        <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Camara</p>
          <div class="mt-3 flex min-h-[160px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
            Vista previa pendiente de integrar
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          [disabled]="!store.canStart()"
          (click)="start()"
        >
          Activar
        </button>
        <button
          type="button"
          class="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="!store.isActive()"
          (click)="stop()"
        >
          Detener
        </button>
        <button
          type="button"
          class="rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="!store.isActive()"
          (click)="toggleRecording()"
        >
          {{ store.recordingLabel() }}
        </button>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Modo accesible</p>
        <p class="mt-2 text-sm text-slate-600">
          En la fase 1 añadiremos sliders para pitch y volumen para uso sin camara.
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  }
})
export class PlayPage {
  readonly store = inject(PlayStore);

  start(): void {
    this.store.start();
  }

  stop(): void {
    this.store.stop();
  }

  toggleRecording(): void {
    this.store.toggleRecording();
  }
}
