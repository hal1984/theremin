import { isPlatformBrowser } from '@angular/common';
import type { ElementRef, OnDestroy } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, MAX, MIN, form, metadata, schema } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

import { SettingsStore } from '../../settings/state/settings.store';
import { PlayStore } from '../state/play.store';
import { PlayOverlayRenderer } from './play-overlay.renderer';

@Component({
  selector: 'app-play-page',
  imports: [FormField, TranslatePipe],
  templateUrl: './play.page.html',
  styleUrl: './play.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class PlayPage implements OnDestroy {
  readonly store = inject(PlayStore);
  readonly settings = inject(SettingsStore);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly overlayRenderer = new PlayOverlayRenderer(this.isBrowser);

  private readonly cameraRef = viewChild.required<ElementRef<HTMLVideoElement>>('camera');
  private readonly overlayRef = viewChild<ElementRef<HTMLCanvasElement>>('overlay');
  readonly cameraAspect = signal(16 / 9);

  readonly model = signal({
    pitch: this.store.pitchHz(),
    gain: this.store.gain(),
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

    effect(() => {
      const pitch = this.store.pitchHz();
      const gain = this.store.gain();
      this.model.update((current) => {
        if (Math.abs(current.pitch - pitch) < 0.01 && Math.abs(current.gain - gain) < 0.005) {
          return current;
        }

        return { pitch, gain };
      });
    });

    effect(() => {
      if (!this.isBrowser) {
        return;
      }

      const video = this.cameraRef()?.nativeElement;
      if (!video) {
        return;
      }

      this.overlayRenderer.attachAspectListener(video, (aspect) => this.cameraAspect.set(aspect));
      this.overlayRenderer.primeVideoElement(video);
      this.store.startPreview(video);
    });

    effect(() => {
      if (!this.isBrowser) {
        return;
      }

      const frame = this.store.lastFrame();
      const canvasRef = this.overlayRef();
      const videoRef = this.cameraRef();

      if (!frame || !canvasRef || !videoRef) {
        this.overlayRenderer.clearOverlay(canvasRef?.nativeElement);
        return;
      }

      this.overlayRenderer.drawOverlay(frame, canvasRef.nativeElement, videoRef.nativeElement);
    });
  }

  start(): void {
    const video = this.cameraRef()?.nativeElement;
    if (!video) {
      this.store.setError('PLAY.ERROR_CAMERA_UNAVAILABLE');
      return;
    }

    this.store.start(video);
  }

  stop(): void {
    this.store.stop();
    this.overlayRenderer.clearOverlay(this.overlayRef()?.nativeElement);
  }

  toggleRecording(): void {
    this.store.toggleRecording();
  }

  ngOnDestroy(): void {
    this.store.stopTracking();
  }
}
