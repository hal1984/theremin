import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { SettingsStore } from '../state/settings.store';

@Component({
  selector: 'app-settings-page',
  imports: [TranslatePipe],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class SettingsPage {
  readonly store = inject(SettingsStore);

  nudgeRange(delta: number): void {
    const minHz = Math.max(20, this.store.minHz() + delta),
      maxHz = Math.max(minHz + 40, this.store.maxHz() + delta);
    this.store.setRange(minHz, maxHz);
  }

  nudgeSmoothing(delta: number): void {
    const nextValue = Math.max(0, this.store.smoothingMs() + delta);
    this.store.setSmoothing(nextValue);
  }

  toggleSwapHands(): void {
    this.store.toggleSwapHands();
  }

  toggleQuantize(): void {
    this.store.toggleQuantize();
  }
}
