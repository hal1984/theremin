import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-play-manual-controls',
  imports: [TranslatePipe],
  templateUrl: './play-manual-controls.component.html',
  styleUrl: './play-manual-controls.component.css',
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
