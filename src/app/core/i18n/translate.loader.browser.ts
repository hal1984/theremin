import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { TranslateLoader } from '@ngx-translate/core';
import type { TranslationObject } from '@ngx-translate/core';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BrowserTranslateLoader implements TranslateLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<TranslationObject> {
    return this.http
      .get<TranslationObject>(`/assets/i18n/${lang}.json`)
      .pipe(catchError(() => of({})));
  }
}
