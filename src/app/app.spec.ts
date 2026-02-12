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
    const events = new Subject<NavigationEnd>();
    const router = { url: '/', events: events.asObservable() } as Router;
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

    events.next(new NavigationEnd(1, '/play', '/play'));

    expect(app).toBeTruthy();
    expect(useSpy).toHaveBeenCalledWith('es');
    expect(app.isPlayActive()).toBe(true);
  });

  it('updates navigation/lang state and browser splash timeout', () => {
    const setTimeoutSpy = vi
      .spyOn(window, 'setTimeout')
      .mockImplementation((handler: TimerHandler) => {
        if (typeof handler === 'function') {
          handler();
        }
        return 1 as unknown as ReturnType<typeof setTimeout>;
      });
    const matchMediaMock = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);
    vi.stubGlobal('matchMedia', matchMediaMock);

    const events = new Subject<NavigationEnd>();
    const router = { url: '/settings', events: events.asObservable() } as Router;
    const langEvents = new Subject<{ lang: string }>();
    const translate = {
      use: vi.fn(),
      onLangChange: langEvents.asObservable(),
      currentLang: 'es',
    } as unknown as TranslateService;

    const injector = Injector.create({
      providers: [
        { provide: Router, useValue: router },
        { provide: TranslateService, useValue: translate },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const app = runInInjectionContext(injector, () => new App());

    expect(app.showSplash()).toBe(false);
    app.toggleNav();
    expect(app.isNavOpen()).toBe(true);
    app.closeNav();
    expect(app.isNavOpen()).toBe(false);

    app.setLanguage('en');
    expect(translate.use).toHaveBeenCalledWith('en');

    events.next(new NavigationEnd(2, '/settings', '/settings'));
    expect(app.isPlayActive()).toBe(false);

    langEvents.next({ lang: 'en' });
    expect(app.currentLang()).toBe('en');

    setTimeoutSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
