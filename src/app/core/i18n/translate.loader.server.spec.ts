import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ServerTranslateLoader } from './translate.loader.server';

describe('ServerTranslateLoader', () => {
  it('returns parsed translations for valid file', async () => {
    const dir = join(process.cwd(), 'public', 'assets', 'i18n');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'vitest-lang.json'), '{"HELLO":"Hola"}', 'utf-8');

    const loader = new ServerTranslateLoader();
    const data = await new Promise((resolve) => {
      loader.getTranslation('vitest-lang').subscribe(resolve);
    });

    expect(data).toEqual({ HELLO: 'Hola' });
  });

  it('returns empty object on missing file', async () => {
    const loader = new ServerTranslateLoader();

    const data = await new Promise((resolve) => {
      loader.getTranslation('lang-that-does-not-exist').subscribe(resolve);
    });

    expect(data).toEqual({});
  });
});
