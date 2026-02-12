import { describe, expect, it } from 'vitest';

import { appConfig } from './app.config';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';

describe('app configuration and routes', () => {
  it('contains expected lazy routes', () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toContain('');
    expect(paths).toContain('play');
    expect(paths).toContain('recordings');
    expect(paths).toContain('settings');
    expect(paths).toContain('about');
    expect(paths).toContain('**');
  });

  it('uses providers in app config', () => {
    expect(appConfig.providers).toBeDefined();
    expect((appConfig.providers ?? []).length).toBeGreaterThan(0);
  });

  it('contains a catch-all prerender server route', () => {
    expect(serverRoutes.some((route) => route.path === '**')).toBe(true);
  });
});
