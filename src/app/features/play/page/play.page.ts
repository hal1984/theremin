import { isPlatformBrowser } from '@angular/common';
import type { OnDestroy } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  effect,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { PlayStore } from '../state/play.store';
import { SettingsStore } from '../../settings/state/settings.store';
import type { HandTrackingFrame } from '../../../domain/theremin/models/hand-tracking.model';
import { ThereminOverlayRenderer } from '../presentation/overlay/theremin-overlay.renderer';
import { PlayStatusComponent } from '../presentation/status/play-status.component';
import { PlayCameraComponent } from '../presentation/camera/play-camera.component';
import { PlayManualControlsComponent } from '../presentation/manual-controls/play-manual-controls.component';
import { PlayActionsComponent } from '../presentation/actions/play-actions.component';

@Component({
  selector: 'app-play-page',
  imports: [
    TranslatePipe,
    PlayStatusComponent,
    PlayCameraComponent,
    PlayManualControlsComponent,
    PlayActionsComponent,
  ],
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
  private readonly overlayRenderer = new ThereminOverlayRenderer();

  readonly cameraAspect = signal(16 / 9);
  private readonly cameraElement = signal<HTMLVideoElement | null>(null);
  private readonly overlayElement = signal<HTMLCanvasElement | null>(null);

  constructor() {
    effect(() => {
      if (!this.isBrowser) {
        return;
      }

      const frame = this.store.lastFrame(),
        video = this.cameraElement(),
        canvas = this.overlayElement();

      if (!frame || !video || !canvas) {
        this.overlayRenderer.clear(canvas ?? undefined);
        return;
      }

      this.drawOverlay(frame, canvas, video);
    });
  }

  onCameraReady(video: HTMLVideoElement): void {
    if (!this.isBrowser) {
      return;
    }

    this.cameraElement.set(video);
    this.attachAspectListener(video);
    this.primeVideoElement(video);
    this.store.startPreview(video);
  }

  onOverlayReady(canvas: HTMLCanvasElement): void {
    this.overlayElement.set(canvas);
  }

  start(): void {
    const video = this.cameraElement();
    if (!video) {
      this.store.setError('PLAY.ERROR_CAMERA_UNAVAILABLE');
      return;
    }

    this.store.start(video);
  }

  stop(): void {
    this.store.stop();
    this.overlayRenderer.clear(this.overlayElement() ?? undefined);
  }

  toggleRecording(): void {
    this.store.toggleRecording();
  }

  setPitch(pitchHz: number): void {
    this.store.setPitch(pitchHz);
  }

  setGain(gain: number): void {
    this.store.setGain(gain);
  }

  ngOnDestroy(): void {
    this.store.stopTracking();
  }

  private drawOverlay(
    frame: HandTrackingFrame,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
  ): void {
    if (!this.isBrowser) {
      return;
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    this.overlayRenderer.draw(frame, canvas, video);
  }

  private attachAspectListener(video: HTMLVideoElement): void {
    const updateAspect = () => {
      const width = video.videoWidth,
        height = video.videoHeight;
      if (width > 0 && height > 0) {
        this.cameraAspect.set(width / height);
      }
    };

    updateAspect();
    video.addEventListener('loadedmetadata', updateAspect, { once: true });
  }

  private primeVideoElement(video: HTMLVideoElement): void {
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
  }
}
