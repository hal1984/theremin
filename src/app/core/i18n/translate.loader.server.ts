import { Injectable } from '@angular/core';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@Injectable({ providedIn: 'root' })
export class ServerTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<Record<string, unknown>> {
    try {
      const filePath = join(process.cwd(), 'public', 'assets', 'i18n', `${lang}.json`);
      const raw = readFileSync(filePath, 'utf-8');
      const json = JSON.parse(raw) as Record<string, unknown>;

      return of(json);
    } catch {
      return of({});
    }
  }
}
