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

const HAND_CONNECTIONS: Array<[number, number]> = [
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
  private overlayCache: { canvas: HTMLCanvasElement; width: number; height: number } | null = null;

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

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
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
      this.overlayCache = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    const overlayCanvas = this.getOverlayCanvas(width, height);
    if (overlayCanvas) {
      ctx.drawImage(overlayCanvas, 0, 0);
    } else {
      this.drawThereminOverlay(ctx, width, height);
    }

    frame.hands.forEach((hand) => {
      ctx.fillStyle = hand.handedness === 'Left' ? '#22c55e' : '#38bdf8';
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 2;

      HAND_CONNECTIONS.forEach(([from, to]) => {
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
    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const roundRectPath = (x: number, y: number, w: number, h: number, r: number) => {
      const radius = clamp(r, 0, Math.min(w, h) / 2);
      const anyCtx = ctx as CanvasRenderingContext2D & {
        roundRect?: (x: number, y: number, w: number, h: number, radii: number | number[]) => void;
      };
      ctx.beginPath();
      if (anyCtx.roundRect) {
        anyCtx.roundRect(x, y, w, h, radius);
        return;
      }

      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    };

    const drawKnob = (
      x: number,
      y: number,
      radius: number,
      angleRadians: number
    ): void => {
      const body = ctx.createRadialGradient(
        x - radius * 0.35,
        y - radius * 0.35,
        radius * 0.2,
        x,
        y,
        radius
      );
      body.addColorStop(0, 'rgba(248,250,252,0.92)');
      body.addColorStop(0.55, 'rgba(148,163,184,0.92)');
      body.addColorStop(1, 'rgba(51,65,85,0.92)');

      ctx.save();
      ctx.fillStyle = body;
      ctx.strokeStyle = 'rgba(15,23,42,0.55)';
      ctx.lineWidth = Math.max(1, radius * 0.18);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pointer
      const pointerLen = radius * 0.9;
      ctx.strokeStyle = 'rgba(15,23,42,0.7)';
      ctx.lineWidth = Math.max(1, radius * 0.14);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angleRadians) * pointerLen, y + Math.sin(angleRadians) * pointerLen);
      ctx.stroke();
      ctx.restore();
    };

    const paddingY = Math.min(height * 0.1, 64);
    const cabinetW = clamp(width * 0.78, 260, width * 0.92);
    const cabinetH = clamp(height * 0.24, 120, 190);
    const cabinetX = (width - cabinetW) / 2;
    const cabinetY = height - paddingY - cabinetH;
    const cabinetRadius = clamp(cabinetH * 0.18, 14, 24);

    const pitchRodX = cabinetX + cabinetW * 0.18;
    const volumeLoopX = cabinetX + cabinetW * 0.82;

    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Shadow
    ctx.save();
    ctx.globalAlpha *= 0.35;
    ctx.fillStyle = 'rgba(15,23,42,0.35)';
    ctx.beginPath();
    ctx.ellipse(
      width / 2,
      cabinetY + cabinetH + cabinetH * 0.18,
      cabinetW * 0.42,
      cabinetH * 0.18,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Cabinet wood
    const wood = ctx.createLinearGradient(cabinetX, cabinetY, cabinetX + cabinetW, cabinetY);
    wood.addColorStop(0, '#5b3417');
    wood.addColorStop(0.18, '#b07543');
    wood.addColorStop(0.5, '#7a4520');
    wood.addColorStop(0.82, '#c0824c');
    wood.addColorStop(1, '#5b3417');

    ctx.fillStyle = wood;
    ctx.strokeStyle = 'rgba(43,24,11,0.9)';
    ctx.lineWidth = clamp(cabinetH * 0.035, 3, 6);
    roundRectPath(cabinetX, cabinetY, cabinetW, cabinetH, cabinetRadius);
    ctx.fill();
    ctx.stroke();

    // Subtle inner edge highlight
    ctx.save();
    ctx.globalAlpha *= 0.5;
    ctx.strokeStyle = 'rgba(248,250,252,0.25)';
    ctx.lineWidth = 1.5;
    roundRectPath(cabinetX + 3, cabinetY + 3, cabinetW - 6, cabinetH - 6, cabinetRadius - 3);
    ctx.stroke();
    ctx.restore();

    // Top highlight/shade
    const shade = ctx.createLinearGradient(cabinetX, cabinetY, cabinetX, cabinetY + cabinetH);
    shade.addColorStop(0, 'rgba(255,255,255,0.28)');
    shade.addColorStop(0.35, 'rgba(255,255,255,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = shade;
    roundRectPath(cabinetX, cabinetY, cabinetW, cabinetH, cabinetRadius);
    ctx.fill();

    // Control panel plate
    const panelMargin = cabinetW * 0.08;
    const panelH = cabinetH * 0.44;
    const panelX = cabinetX + panelMargin;
    const panelY = cabinetY + cabinetH * 0.12;
    const panelW = cabinetW - panelMargin * 2;
    const panelR = clamp(cabinetRadius * 0.8, 10, 18);

    const metal = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
    metal.addColorStop(0, 'rgba(226,232,240,0.92)');
    metal.addColorStop(0.28, 'rgba(148,163,184,0.92)');
    metal.addColorStop(0.6, 'rgba(241,245,249,0.86)');
    metal.addColorStop(1, 'rgba(100,116,139,0.9)');

    ctx.fillStyle = metal;
    ctx.strokeStyle = 'rgba(30,41,59,0.5)';
    ctx.lineWidth = 2;
    roundRectPath(panelX, panelY, panelW, panelH, panelR);
    ctx.fill();
    ctx.stroke();

    // Knobs row
    const knobY = panelY + panelH * 0.62;
    const knobR = clamp(panelH * 0.22, 10, 18);
    const knobXs = [
      panelX + panelW * 0.18,
      panelX + panelW * 0.38,
      panelX + panelW * 0.58,
      panelX + panelW * 0.78,
    ];
    knobXs.forEach((x, index) => {
      drawKnob(x, knobY, knobR, (-Math.PI / 2) + index * 0.35);
    });

    // Speaker grill
    const grillX = cabinetX + cabinetW * 0.6;
    const grillY = cabinetY + cabinetH * 0.64;
    const grillW = cabinetW * 0.32;
    const grillH = cabinetH * 0.25;
    const grillR = clamp(grillH * 0.28, 10, 18);
    ctx.save();
    ctx.globalAlpha *= 0.65;
    ctx.fillStyle = 'rgba(15,23,42,0.33)';
    roundRectPath(grillX, grillY, grillW, grillH, grillR);
    ctx.fill();

    ctx.globalAlpha *= 0.8;
    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    const dotR = clamp(grillH * 0.06, 1.4, 3);
    const step = dotR * 3;
    for (let y = grillY + dotR * 2; y <= grillY + grillH - dotR * 2; y += step) {
      for (let x = grillX + dotR * 2; x <= grillX + grillW - dotR * 2; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Brand text
    ctx.save();
    ctx.globalAlpha *= 0.6;
    ctx.fillStyle = 'rgba(15,23,42,0.45)';
    ctx.font = `600 ${clamp(cabinetH * 0.12, 12, 18)}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THEREMIN', width / 2, cabinetY + cabinetH * 0.84);
    ctx.restore();

    // Antennas (metal)
    const antennaWidth = clamp(cabinetH * 0.03, 3, 5);
    const metalStroke = (x: number): CanvasGradient => {
      const g = ctx.createLinearGradient(x - antennaWidth, 0, x + antennaWidth, 0);
      g.addColorStop(0, 'rgba(226,232,240,0.82)');
      g.addColorStop(0.5, 'rgba(148,163,184,0.95)');
      g.addColorStop(1, 'rgba(248,250,252,0.82)');
      return g;
    };

    ctx.save();
    ctx.globalAlpha *= 0.95;
    ctx.lineWidth = antennaWidth;

    // Pitch rod (left)
    const rodTopY = Math.max(height * 0.06, 24);
    ctx.strokeStyle = metalStroke(pitchRodX);
    ctx.beginPath();
    ctx.moveTo(pitchRodX, cabinetY);
    ctx.lineTo(pitchRodX, rodTopY);
    ctx.stroke();

    const ballR = antennaWidth * 1.6;
    const ball = ctx.createRadialGradient(
      pitchRodX - ballR * 0.35,
      rodTopY - ballR * 0.35,
      1,
      pitchRodX,
      rodTopY,
      ballR * 1.8
    );
    ball.addColorStop(0, 'rgba(248,250,252,0.95)');
    ball.addColorStop(1, 'rgba(148,163,184,0.95)');
    ctx.fillStyle = ball;
    ctx.beginPath();
    ctx.arc(pitchRodX, rodTopY, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(71,85,105,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Volume loop (right)
    const loopY = cabinetY - cabinetH * 0.08;
    const loopRx = clamp(cabinetW * 0.06, 16, 28);
    const loopRy = loopRx * 0.55;
    ctx.strokeStyle = metalStroke(volumeLoopX);
    ctx.lineWidth = antennaWidth;
    ctx.beginPath();
    ctx.moveTo(volumeLoopX, cabinetY);
    ctx.lineTo(volumeLoopX, loopY + loopRy);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(volumeLoopX, loopY, loopRx, loopRy, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  private getOverlayCanvas(width: number, height: number): HTMLCanvasElement | null {
    if (!this.isBrowser) {
      return null;
    }

    if (!this.overlayCache || this.overlayCache.width !== width || this.overlayCache.height !== height) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      this.drawThereminOverlay(ctx, width, height);
      this.overlayCache = { canvas, width, height };
    }

    return this.overlayCache.canvas;
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
