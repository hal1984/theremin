import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { BrowserTranslateLoader } from '../i18n/translate.loader.browser';

type I18nConfig = {
  defaultLang: string;
  fallbackLang: string;
};

const defaultConfig: I18nConfig = {
  defaultLang: 'es',
  fallbackLang: 'en'
};

export const provideI18n = (overrides: Partial<I18nConfig> = {}): EnvironmentProviders => {
  const config = { ...defaultConfig, ...overrides };

  return makeEnvironmentProviders([
    provideHttpClient(withFetch()),
    provideTranslateService({
      loader: { provide: TranslateLoader, useClass: BrowserTranslateLoader },
      defaultLanguage: config.defaultLang,
      useDefaultLang: true
    })
  ]);
};
