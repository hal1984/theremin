import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-play-status',
  imports: [TranslatePipe],
  templateUrl: './play-status.component.html',
  styleUrl: './play-status.component.css',
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
