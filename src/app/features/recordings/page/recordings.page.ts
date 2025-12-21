import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { RecordingsStore } from '../state/recordings.store';

@Component({
  selector: 'app-recordings-page',
  imports: [TranslatePipe],
  templateUrl: './recordings.page.html',
  styleUrl: './recordings.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  }
})
export class RecordingsPage {
  readonly store = inject(RecordingsStore);

  select(id: string): void {
    this.store.select(id);
  }
}
