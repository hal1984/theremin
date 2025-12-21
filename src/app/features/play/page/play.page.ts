import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
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
export class PlayPage implements OnDestroy {
  readonly store = inject(PlayStore);
  readonly settings = inject(SettingsStore);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly cameraRef = viewChild.required<ElementRef<HTMLVideoElement>>('camera');

  private readonly overlayRef = viewChild<ElementRef<HTMLCanvasElement>>('overlay');
  readonly cameraAspect = signal(16 / 9);

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

      this.attachAspectListener(video);
      this.primeVideoElement(video);
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

  ngOnDestroy(): void {
    this.store.stopTracking();
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
    try {
      ctx.drawImage(video, 0, 0, width, height);
    } catch {
      // Ignore draw errors if the video frame is not ready yet.
    }

    this.drawThereminOverlay(ctx, width, height);

    frame.hands.forEach((hand) => {
      ctx.fillStyle = hand.handedness === 'Left' ? '#22c55e' : '#38bdf8';
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 2;

      const connections: Array<[number, number]> = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [0, 5],
        [5, 6],
        [6, 7],
        [7, 8],
        [5, 9],
        [9, 10],
        [10, 11],
        [11, 12],
        [9, 13],
        [13, 14],
        [14, 15],
        [15, 16],
        [13, 17],
        [17, 18],
        [18, 19],
        [19, 20],
        [0, 17]
      ];

      connections.forEach(([from, to]) => {
        const a = hand.landmarks[from];
        const b = hand.landmarks[to];
        if (!a || !b) {
          return;
        }

        ctx.beginPath();
        ctx.moveTo(a.x * width, a.y * height);
        ctx.lineTo(b.x * width, b.y * height);
        ctx.stroke();
      });

      hand.landmarks.forEach((landmark) => {
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      const tip = hand.landmarks[8];
      if (tip) {
        ctx.beginPath();
        ctx.arc(tip.x * width, tip.y * height, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
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

  private drawThereminOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const paddingX = width * 0.12;
    const paddingY = height * 0.12;
    const baseWidth = width - paddingX * 2;
    const baseHeight = Math.min(height * 0.18, 140);
    const baseX = paddingX;
    const baseY = height - paddingY - baseHeight;

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#6b4f2a';
    ctx.fillStyle = 'rgba(139, 94, 60, 1)';
    ctx.lineWidth = 3;

    // Base
    ctx.beginPath();
    ctx.roundRect(baseX, baseY, baseWidth, baseHeight, 18);
    ctx.fill();
    ctx.stroke();

    // Control panel lines
    ctx.beginPath();
    ctx.moveTo(baseX + baseWidth * 0.2, baseY + baseHeight * 0.35);
    ctx.lineTo(baseX + baseWidth * 0.8, baseY + baseHeight * 0.35);
    ctx.moveTo(baseX + baseWidth * 0.2, baseY + baseHeight * 0.6);
    ctx.lineTo(baseX + baseWidth * 0.7, baseY + baseHeight * 0.6);
    ctx.stroke();

    // Volume loop antenna (right)
    const loopCenterX = baseX + baseWidth * 0.82;
    const loopCenterY = baseY - baseHeight * 0.2;
    ctx.beginPath();
    ctx.ellipse(loopCenterX, loopCenterY, 22, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(loopCenterX, baseY);
    ctx.lineTo(loopCenterX, loopCenterY + 12);
    ctx.stroke();

    // Pitch rod antenna (left)
    const rodX = baseX + baseWidth * 0.18;
    const rodTopY = paddingY * 0.4;
    ctx.beginPath();
    ctx.moveTo(rodX, baseY);
    ctx.lineTo(rodX, rodTopY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rodX, rodTopY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private attachAspectListener(video: HTMLVideoElement): void {
    const updateAspect = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
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
