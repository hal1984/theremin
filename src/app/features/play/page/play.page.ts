import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Field, MAX, MIN, form, metadata, schema } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

import { PlayStore } from '../state/play.store';
import { SettingsStore } from '../../settings/state/settings.store';

@Component({
  selector: 'app-play-page',
  imports: [Field, TranslatePipe],
  templateUrl: './play.page.html',
  styleUrl: './play.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  }
})
export class PlayPage {
  readonly store = inject(PlayStore);
  readonly settings = inject(SettingsStore);

  readonly model = signal({
    pitch: this.store.pitchHz(),
    gain: this.store.gain()
  });
  private readonly formSchema = schema<{ pitch: number; gain: number }>((path) => {
    metadata(path.pitch, MIN, () => this.settings.minHz());
    metadata(path.pitch, MAX, () => this.settings.maxHz());
    metadata(path.gain, MIN, () => 0);
    metadata(path.gain, MAX, () => 1);
  });
  readonly controls = form(this.model, this.formSchema);

  constructor() {
    effect(() => {
      this.store.setPitch(this.controls.pitch().value());
    });

    effect(() => {
      this.store.setGain(this.controls.gain().value());
    });
  }

  start(): void {
    this.store.start();
  }

  stop(): void {
    this.store.stop();
  }

  toggleRecording(): void {
    this.store.toggleRecording();
  }
}
