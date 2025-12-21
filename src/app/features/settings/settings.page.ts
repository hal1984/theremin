import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SettingsStore } from './state/settings.store';

@Component({
  selector: 'app-settings-page',
  template: `
    <section class="flex flex-col gap-6">
      <header class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Ajustes</p>
        <h1 class="text-3xl font-semibold text-slate-900">Configuracion base</h1>
        <p class="text-base text-slate-600">
          Estos valores afectan el mapeo de pitch y volumen. En la fase 1 los haremos editables.
        </p>
      </header>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Rango de pitch</p>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ store.rangeLabel() }}</p>
          <div class="mt-3 flex items-center gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
              (click)="nudgeRange(-20)"
            >
              -20 Hz
            </button>
            <button
              type="button"
              class="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
              (click)="nudgeRange(20)"
            >
              +20 Hz
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Suavizado</p>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ store.smoothingMs() }} ms</p>
          <div class="mt-3 flex items-center gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
              (click)="nudgeSmoothing(-5)"
            >
              -5 ms
            </button>
            <button
              type="button"
              class="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
              (click)="nudgeSmoothing(5)"
            >
              +5 ms
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Preferencias</p>
        <div class="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold"
            [class.border-emerald-300]="store.swapHands()"
            [class.bg-emerald-50]="store.swapHands()"
            [class.text-emerald-700]="store.swapHands()"
            [class.border-slate-300]="!store.swapHands()"
            [class.text-slate-700]="!store.swapHands()"
            (click)="toggleSwapHands()"
          >
            Swap manos: {{ store.swapHands() ? 'Si' : 'No' }}
          </button>
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold"
            [class.border-emerald-300]="store.quantize()"
            [class.bg-emerald-50]="store.quantize()"
            [class.text-emerald-700]="store.quantize()"
            [class.border-slate-300]="!store.quantize()"
            [class.text-slate-700]="!store.quantize()"
            (click)="toggleQuantize()"
          >
            Cuantizar: {{ store.quantize() ? 'Si' : 'No' }}
          </button>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  }
})
export class SettingsPage {
  readonly store = inject(SettingsStore);

  nudgeRange(delta: number): void {
    const minHz = Math.max(20, this.store.minHz() + delta);
    const maxHz = Math.max(minHz + 40, this.store.maxHz() + delta);
    this.store.setRange(minHz, maxHz);
  }

  nudgeSmoothing(delta: number): void {
    const nextValue = Math.max(0, this.store.smoothingMs() + delta);
    this.store.setSmoothing(nextValue);
  }

  toggleSwapHands(): void {
    this.store.toggleSwapHands();
  }

  toggleQuantize(): void {
    this.store.toggleQuantize();
  }
}
