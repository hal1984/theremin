import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-joya-splash',
  imports: [NgOptimizedImage, TranslatePipe],
  templateUrl: './joya-splash.component.html',
  styleUrl: './joya-splash.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class JoyaSplashComponent {
  readonly active = input(false);
}
