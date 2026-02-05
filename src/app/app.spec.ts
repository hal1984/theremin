import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { App } from './app';
import { routes } from './app.routes';

class TestTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      'APP.SUBTITLE': 'Joya Theremin',
      'COMMON.SKIP_TO_CONTENT': 'Skip to content',
      'COMMON.NAV': 'Navigation',
      'COMMON.MENU_OPEN': 'Open menu',
      'COMMON.MENU_CLOSE': 'Close menu',
      'COMMON.LANG_ES': 'ES',
      'COMMON.LANG_EN': 'EN',
      'NAV.PLAY': 'Play',
      'NAV.RECORDINGS': 'Recordings',
      'NAV.SETTINGS': 'Settings',
      'NAV.ABOUT': 'About',
    });
  }
}

describe('App', () => {
  beforeEach(async () => {
    const w = globalThis as unknown as { matchMedia?: (query: string) => MediaQueryList };
    if (!w.matchMedia) {
      w.matchMedia = (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList;
    }

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideTranslateService({
          loader: { provide: TranslateLoader, useClass: TestTranslateLoader },
          fallbackLang: 'en',
        }),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render sidebar subtitle once splash is hidden', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.showSplash.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Joya Theremin');
  });
});
