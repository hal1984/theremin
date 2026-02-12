import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-play-status',
  imports: [TranslatePipe],
  template: `
    <div class="order-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:order-1">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {{ 'PLAY.STATUS_LABEL' | translate }}
      </p>
      <p class="mt-2 text-xl font-semibold text-slate-900" aria-live="polite">
        {{ statusLabelKey() | translate }}
        @if (!isActive()) {
          <span class="ml-2 text-sm font-semibold text-slate-700">
            {{ 'PLAY.STATUS_TAP_TO_START' | translate }}
          </span>
        }
      </p>
      @if (hasError() && errorMessageKey()) {
        <p class="mt-2 text-sm text-red-600" role="alert">
          {{ errorMessageKey()! | translate }}
        </p>
      }
      <p class="mt-3 text-sm text-slate-700">
        {{ 'PLAY.STATUS_VALUES' | translate: { note: pitchNoteLabel(), db: volumeDb() } }}
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class PlayStatusComponent {
  readonly statusLabelKey = input.required<string>();
  readonly isActive = input.required<boolean>();
  readonly hasError = input.required<boolean>();
  readonly errorMessageKey = input<string | null>(null);
  readonly pitchNoteLabel = input.required<string>();
  readonly volumeDb = input.required<number>();
}
