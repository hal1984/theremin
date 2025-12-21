import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-about-page',
  template: `
    <section class="flex flex-col gap-6">
      <header class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Sobre</p>
        <h1 class="text-3xl font-semibold text-slate-900">Theremin por webcam</h1>
        <p class="text-base text-slate-600">
          Esta app procesa el video de la camara en tu dispositivo. No sube video ni audio a un servidor por defecto.
        </p>
      </header>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">Compatibilidad</h2>
        <p class="mt-2 text-sm text-slate-600">
          Necesitas HTTPS y un navegador moderno con soporte de Web Audio y getUserMedia.
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  }
})
export class AboutPage {}
