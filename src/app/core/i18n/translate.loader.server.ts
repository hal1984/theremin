import { Injectable } from '@angular/core';
import type { TranslateLoader } from '@ngx-translate/core';
import type { TranslationObject } from '@ngx-translate/core';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@Injectable({ providedIn: 'root' })
export class ServerTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    try {
      const filePath = join(process.cwd(), 'public', 'assets', 'i18n', `${lang}.json`),
        raw = readFileSync(filePath, 'utf-8'),
        parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return of({});
      }

      return of(parsed as TranslationObject);
    } catch {
      return of({});
    }
  }
}
