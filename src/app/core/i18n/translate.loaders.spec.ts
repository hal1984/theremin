import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';

import { BrowserTranslateLoader } from './translate.loader.browser';

describe('translate loaders', () => {
  describe('BrowserTranslateLoader', () => {
    const http = {
      get: vi.fn(),
    };

    beforeEach(() => {
      http.get.mockReset();
      TestBed.configureTestingModule({
        providers: [
          BrowserTranslateLoader,
          {
            provide: HttpClient,
            useValue: http,
          },
        ],
      });
    });

    it('loads translation json', async () => {
      http.get.mockReturnValue(of({ HELLO: 'hola' }));
      const loader = TestBed.inject(BrowserTranslateLoader);

      await expect(firstValueFrom(loader.getTranslation('es'))).resolves.toEqual({ HELLO: 'hola' });
    });

    it('returns empty object on http error', async () => {
      http.get.mockReturnValue(throwError(() => new Error('network')));
      const loader = TestBed.inject(BrowserTranslateLoader);

      await expect(firstValueFrom(loader.getTranslation('es'))).resolves.toEqual({});
    });
  });
});
