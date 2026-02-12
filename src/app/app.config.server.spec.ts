import { describe, expect, it } from 'vitest';

import { config } from './app.config.server';

describe('app.config.server', () => {
  it('exports merged providers', () => {
    expect(config.providers).toBeTruthy();
    expect(Array.isArray(config.providers)).toBe(true);
  });
});
