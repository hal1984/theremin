import type { EnvironmentProviders } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';

import { BrowserTranslateLoader } from '../i18n/translate.loader.browser';

interface I18nConfig {
  defaultLang: string;
  fallbackLang: string;
}

const defaultConfig: I18nConfig = {
  defaultLang: 'es',
  fallbackLang: 'en',
};

export const provideI18n = (overrides: Partial<I18nConfig> = {}): EnvironmentProviders => {
  const config = { ...defaultConfig, ...overrides };

  return makeEnvironmentProviders([
    provideHttpClient(withFetch()),
    provideTranslateService({
      loader: { provide: TranslateLoader, useClass: BrowserTranslateLoader },
      // `defaultLanguage`/`useDefaultLang` are deprecated in ngx-translate v17.
      fallbackLang: config.fallbackLang,
    }),
  ]);
};
