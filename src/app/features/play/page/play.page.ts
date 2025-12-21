import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, PLATFORM_ID, effect, inject, signal, viewChild } from '@angular/core';
import { Field, MAX, MIN, form, metadata, schema } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

import { PlayStore } from '../state/play.store';
import { SettingsStore } from '../../settings/state/settings.store';
import { HandTrackingFrame } from '../../../domain/theremin/models/hand-tracking.model';

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
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly cameraRef = viewChild<ElementRef<HTMLVideoElement>>('camera');

  private readonly overlayRef = viewChild<ElementRef<HTMLCanvasElement>>('overlay');

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
    effect(() => {
      if (!this.isBrowser) {
        return;
      }

      const frame = this.store.lastFrame();
      const canvasRef = this.overlayRef();
      const videoRef = this.cameraRef();

      if (!frame || !canvasRef || !videoRef) {
        this.clearOverlay(canvasRef?.nativeElement);
        return;
      }

      this.drawOverlay(frame, canvasRef.nativeElement, videoRef.nativeElement);
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
    this.clearOverlay(this.overlayRef()?.nativeElement);
  }

  toggleRecording(): void {
    this.store.toggleRecording();
  }

  private drawOverlay(
    frame: HandTrackingFrame,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
  ): void {
    if (!this.isBrowser) {
      return;
    }

    const width = video.videoWidth || video.clientWidth;
    const height = video.videoHeight || video.clientHeight;
    if (!width || !height) {
      return;
    }

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);

    frame.hands.forEach((hand) => {
      ctx.fillStyle = hand.handedness === 'Left' ? '#22c55e' : '#38bdf8';
      hand.landmarks.forEach((landmark) => {
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  private clearOverlay(canvas?: HTMLCanvasElement): void {
    if (!this.isBrowser) {
      return;
    }
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
