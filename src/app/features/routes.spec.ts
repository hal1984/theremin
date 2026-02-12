import { describe, expect, it } from 'vitest';

import { aboutRoutes } from './about/about.routes';
import { playRoutes } from './play/play.routes';
import { recordingsRoutes } from './recordings/recordings.routes';
import { settingsRoutes } from './settings/settings.routes';

describe('feature route exports', () => {
  it('declares one default route per feature', () => {
    expect(playRoutes[0]?.path).toBe('');
    expect(recordingsRoutes[0]?.path).toBe('');
    expect(settingsRoutes[0]?.path).toBe('');
    expect(aboutRoutes[0]?.path).toBe('');
  });
});
