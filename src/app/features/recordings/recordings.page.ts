import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RecordingsStore } from './state/recordings.store';

@Component({
  selector: 'app-recordings-page',
  template: `
    <section class="flex flex-col gap-6">
      <header class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Grabaciones</p>
        <h1 class="text-3xl font-semibold text-slate-900">Tus sesiones</h1>
        <p class="text-base text-slate-600">
          Aqui apareceran las grabaciones cuando activemos el recorder.
        </p>
      </header>

      @if (store.isEmpty()) {
        <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No hay grabaciones todavia.
        </div>
      } @else {
        <div class="grid gap-4">
          @for (item of store.items(); track item.id) {
            <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-base font-semibold text-slate-900">{{ item.title }}</h2>
                  <p class="text-sm text-slate-500">
                    {{ item.durationSeconds }} s · {{ item.createdAtLabel }}
                  </p>
                </div>
                <button
                  type="button"
                  class="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                  (click)="select(item.id)"
                >
                  Ver
                </button>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  }
})
export class RecordingsPage {
  readonly store = inject(RecordingsStore);

  select(id: string): void {
    this.store.select(id);
  }
}
