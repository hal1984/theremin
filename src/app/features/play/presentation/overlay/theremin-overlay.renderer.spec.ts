import { describe, expect, it } from 'vitest';

import { ThereminOverlayRenderer } from './theremin-overlay.renderer';

describe('ThereminOverlayRenderer', () => {
  it('clears canvas without throwing', () => {
    const renderer = new ThereminOverlayRenderer();
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    expect(() => renderer.clear(canvas)).not.toThrow();
  });

  it('clear accepts undefined canvas', () => {
    const renderer = new ThereminOverlayRenderer();
    expect(() => renderer.clear(undefined)).not.toThrow();
  });
});
