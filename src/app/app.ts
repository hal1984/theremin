import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block min-h-dvh bg-slate-100 text-slate-900'
  }
})
export class App {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(map((event) => event.lang)),
    { initialValue: this.translate.currentLang || 'es' }
  );

  readonly isPlayActive = computed(() => {
    const path = this.currentUrl();
    return path === '/' || path.startsWith('/play');
  });

  constructor() {
    this.translate.use('es');
  }

  setLanguage(lang: 'es' | 'en'): void {
    this.translate.use(lang);
  }
}
