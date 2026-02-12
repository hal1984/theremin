import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-play-actions',
  imports: [TranslatePipe],
  styleUrl: './play-actions.component.css',
  templateUrl: './play-actions.component.html',
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
