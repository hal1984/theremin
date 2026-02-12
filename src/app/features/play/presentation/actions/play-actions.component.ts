import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-play-actions',
  imports: [TranslatePipe],
  styleUrl: './play-actions.component.css',
  template: `
    <div class="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
      <button
        type="button"
        class="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
        [class.animate-pulse]="shouldPulseStart()"
        [class.ring-2]="shouldPulseStart()"
        [class.ring-slate-900/40]="shouldPulseStart()"
        [class.ring-offset-2]="shouldPulseStart()"
        [class.ring-rose-400/80]="shouldPulseStart()"
        [class.joya-pulse]="shouldPulseStart()"
        [disabled]="!canStart()"
        (click)="startPressed.emit()"
      >
        {{ 'PLAY.ACTION_START' | translate }}
      </button>
      <button
        type="button"
        class="rounded-full border border-slate-300 bg-slate-200/90 px-5 py-3 text-sm font-semibold text-slate-600 shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        [disabled]="!isActive()"
        (click)="stopPressed.emit()"
      >
        {{ 'PLAY.ACTION_STOP' | translate }}
      </button>
      <button
        type="button"
        class="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
        [disabled]="!isActive()"
        (click)="recordPressed.emit()"
      >
        {{ recordingLabelKey() | translate }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class PlayActionsComponent {
  readonly canStart = input.required<boolean>();
  readonly isActive = input.required<boolean>();
  readonly shouldPulseStart = input.required<boolean>();
  readonly recordingLabelKey = input.required<string>();

  readonly startPressed = output<void>();
  readonly stopPressed = output<void>();
  readonly recordPressed = output<void>();
}
