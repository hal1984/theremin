import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-play-manual-controls',
  imports: [TranslatePipe],
  template: `
    <div class="rounded-2xl border border-slate-200 bg-white p-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {{ 'PLAY.ACCESSIBLE_LABEL' | translate }}
      </p>
      <p class="mt-2 text-sm text-slate-600">
        {{ 'PLAY.ACCESSIBLE_DESCRIPTION' | translate }}
      </p>
      <form
        class="mt-4 grid gap-4 md:grid-cols-2"
        [attr.aria-label]="'PLAY.ACCESSIBLE_FORM' | translate"
      >
        <label class="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          {{ 'PLAY.PITCH_LABEL' | translate }}
          <input
            type="range"
            class="h-2 w-full cursor-pointer accent-slate-900"
            [min]="pitchMin()"
            [max]="pitchMax()"
            [value]="pitchValue()"
            step="1"
            [attr.aria-label]="'PLAY.PITCH_ARIA' | translate"
            (input)="onPitchInput($event)"
          />
          <span class="text-xs font-semibold text-slate-700">
            {{ pitchNoteLabel() }} · {{ pitchValue().toPrecision(3) }} {{ 'COMMON.HZ' | translate }}
          </span>
        </label>
        <label class="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          {{ 'PLAY.GAIN_LABEL' | translate }}
          <input
            type="range"
            class="h-2 w-full cursor-pointer accent-slate-900"
            min="0"
            max="1"
            [value]="gainValue()"
            step="0.01"
            [attr.aria-label]="'PLAY.GAIN_ARIA' | translate"
            (input)="onGainInput($event)"
          />
          <span class="text-xs font-semibold text-slate-700"> {{ volumeDb() }} dB </span>
        </label>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class PlayManualControlsComponent {
  readonly pitchValue = input.required<number>();
  readonly pitchMin = input.required<number>();
  readonly pitchMax = input.required<number>();
  readonly gainValue = input.required<number>();
  readonly pitchNoteLabel = input.required<string>();
  readonly volumeDb = input.required<number>();

  readonly pitchChange = output<number>();
  readonly gainChange = output<number>();

  onPitchInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.pitchChange.emit(value);
  }

  onGainInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.gainChange.emit(value);
  }
}
