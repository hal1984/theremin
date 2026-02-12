import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';

describe('app routes', () => {
  it('defines redirects and lazy routes', async () => {
    expect(routes.find((r) => r.path === '**')?.redirectTo).toBe('play');

    const playRoot = await routes[0]?.loadChildren?.();
    const playAlias = await routes[1]?.loadChildren?.();
    const recordings = await routes[2]?.loadChildren?.();
    const settings = await routes[3]?.loadChildren?.();
    const about = await routes[4]?.loadChildren?.();

    expect(Array.isArray(playRoot)).toBe(true);
    expect(Array.isArray(playAlias)).toBe(true);
    expect(Array.isArray(recordings)).toBe(true);
    expect(Array.isArray(settings)).toBe(true);
    expect(Array.isArray(about)).toBe(true);
  });
});
