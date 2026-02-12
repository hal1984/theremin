import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { CONFIRMATION } from '../../../core/di/tokens/platform.token';
import { RecordingsStore } from '../state/recordings.store';

@Component({
  selector: 'app-recordings-page',
  imports: [TranslatePipe],
  templateUrl: './recordings.page.html',
  styleUrl: './recordings.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class RecordingsPage {
  readonly store = inject(RecordingsStore);
  private readonly translate = inject(TranslateService);
  private readonly confirmation = inject(CONFIRMATION);

  constructor() {
    void this.store.load();
  }

  select(id: string): void {
    this.store.select(id);
  }

  remove(id: string): void {
    const confirmed = this.confirmation.confirm(
      this.translate.instant('RECORDINGS.CONFIRM_DELETE'),
    );
    if (!confirmed) {
      return;
    }
    this.store.remove(id);
  }

  clear(): void {
    const confirmed = this.confirmation.confirm(this.translate.instant('RECORDINGS.CONFIRM_CLEAR'));
    if (!confirmed) {
      return;
    }
    this.store.clear();
  }
}
