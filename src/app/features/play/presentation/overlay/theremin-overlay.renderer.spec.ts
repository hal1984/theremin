import { describe, expect, it, vi } from 'vitest';

import type { HandTrackingFrame } from '../../../../domain/theremin/models/hand-tracking.model';
import { ThereminOverlayRenderer } from './theremin-overlay.renderer';

const createCtx = () => {
  const gradient = { addColorStop: vi.fn() };
  return {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    ellipse: vi.fn(),
    fillText: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    save: vi.fn(),
    restore: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
};

describe('ThereminOverlayRenderer', () => {
  it('draw exits when video has no size', () => {
    const renderer = new ThereminOverlayRenderer();
    const canvas = document.createElement('canvas');
    const ctx = createCtx();
    vi.spyOn(canvas, 'getContext').mockReturnValue(ctx);

    renderer.draw({ hands: [], timestampMs: 0 }, canvas, {
      videoWidth: 0,
      videoHeight: 0,
      clientWidth: 0,
      clientHeight: 0,
    } as HTMLVideoElement);

    expect((ctx.clearRect as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it('draw renders overlay and landmarks', () => {
    const renderer = new ThereminOverlayRenderer();
    const canvas = document.createElement('canvas');
    const ctx = createCtx();
    vi.spyOn(canvas, 'getContext').mockReturnValue(ctx);

    const frame: HandTrackingFrame = {
      timestampMs: 1,
      hands: [
        {
          handedness: 'Right',
          score: 1,
          landmarks: Array.from({ length: 21 }, (_, i) => ({ x: i / 30, y: i / 40, z: 0 })),
        },
      ],
    };

    renderer.draw(frame, canvas, {
      videoWidth: 300,
      videoHeight: 200,
      clientWidth: 0,
      clientHeight: 0,
    } as HTMLVideoElement);

    expect(
      (ctx.clearRect as unknown as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThan(0);
    expect((ctx.arc as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it('clear handles undefined and contextless canvas', () => {
    const renderer = new ThereminOverlayRenderer();
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);

    expect(() => renderer.clear(undefined)).not.toThrow();
    expect(() => renderer.clear(canvas)).not.toThrow();
  });
});
