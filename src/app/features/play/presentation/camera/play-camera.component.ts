import type { AfterViewInit, ElementRef } from '@angular/core';
import { ChangeDetectionStrategy, Component, output, input, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-play-camera',
  imports: [TranslatePipe],
  templateUrl: './play-camera.component.html',
  styleUrl: './play-camera.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class PlayCameraComponent implements AfterViewInit {
  readonly aspectRatio = input(16 / 9);
  readonly cameraReady = output<HTMLVideoElement>();
  readonly overlayReady = output<HTMLCanvasElement>();

  private readonly cameraRef = viewChild.required<ElementRef<HTMLVideoElement>>('camera');
  private readonly overlayRef = viewChild.required<ElementRef<HTMLCanvasElement>>('overlay');

  ngAfterViewInit(): void {
    this.cameraReady.emit(this.cameraRef().nativeElement);
    this.overlayReady.emit(this.overlayRef().nativeElement);
  }
}
