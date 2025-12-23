import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PLATFORM_ID } from '@angular/core';
import { JoyaSplashComponent } from './shared/splash/joya-splash.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, JoyaSplashComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block min-h-dvh bg-slate-100 text-slate-900'
  }
})
export class App {
  private readonly platformId = inject(PLATFORM_ID);
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
  readonly isNavOpen = signal(false);
  readonly showSplash = signal(true);

  readonly isPlayActive = computed(() => {
    const path = this.currentUrl();
    return path === '/' || path.startsWith('/play');
  });

  constructor() {
    this.translate.use('es');
    if (isPlatformBrowser(this.platformId)) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const durationMs = prefersReducedMotion ? 700 : 2600;
      window.setTimeout(() => this.showSplash.set(false), durationMs);
    }
  }

  setLanguage(lang: 'es' | 'en'): void {
    this.translate.use(lang);
  }

  toggleNav(): void {
    this.isNavOpen.update((open) => !open);
  }

  closeNav(): void {
    this.isNavOpen.set(false);
  }
}
