import '@angular/compiler';
import { Injector, PLATFORM_ID, runInInjectionContext } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { App } from './app';

describe('App (class tests)', () => {
  it('creates app and defaults language to es', () => {
    const useSpy = vi.fn();
    const router = { url: '/', events: new Subject<NavigationEnd>().asObservable() } as Router;
    const translate = {
      use: useSpy,
      onLangChange: new Subject<{ lang: string }>().asObservable(),
      currentLang: 'en',
    } as unknown as TranslateService;

    const injector = Injector.create({
      providers: [
        { provide: Router, useValue: router },
        { provide: TranslateService, useValue: translate },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const app = runInInjectionContext(injector, () => new App());

    expect(app).toBeTruthy();
    expect(useSpy).toHaveBeenCalledWith('es');
  });

  it('updates navigation state with class methods', () => {
    const router = { url: '/', events: new Subject<NavigationEnd>().asObservable() } as Router;
    const translate = {
      use: vi.fn(),
      onLangChange: new Subject<{ lang: string }>().asObservable(),
      currentLang: 'es',
    } as unknown as TranslateService;

    const injector = Injector.create({
      providers: [
        { provide: Router, useValue: router },
        { provide: TranslateService, useValue: translate },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const app = runInInjectionContext(injector, () => new App());

    expect(app.isNavOpen()).toBe(false);
    app.toggleNav();
    expect(app.isNavOpen()).toBe(true);
    app.closeNav();
    expect(app.isNavOpen()).toBe(false);

    app.showSplash.set(false);
    expect(app.showSplash()).toBe(false);
  });
});
