import { describe, expect, it, vi } from 'vitest';

import { BrowserClockService } from './browser-clock.service';
import {
  BrowserConfirmationService,
  NoopConfirmationService,
} from './browser-confirmation.service';
import { BrowserObjectUrlService, NoopObjectUrlService } from './browser-object-url.service';
import { BrowserUuidService, NoopUuidService } from './browser-uuid.service';

describe('platform services', () => {
  it('clock formats localized datetime', () => {
    const clock = new BrowserClockService();
    const value = clock.formatShortDateTime(new Date('2026-02-12T12:00:00.000Z'), 'es');

    expect(value.length).toBeGreaterThan(0);
  });

  it('confirmation adapters return expected values', () => {
    const spy = vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    const browser = new BrowserConfirmationService();
    const noop = new NoopConfirmationService();

    expect(browser.confirm('ok?')).toBe(true);
    expect(noop.confirm()).toBe(true);

    spy.mockRestore();
  });

  it('uuid adapters generate strings', () => {
    const browser = new BrowserUuidService();
    const noop = new NoopUuidService();

    expect(typeof browser.generate()).toBe('string');
    expect(typeof noop.generate()).toBe('string');
  });

  it('object-url noop works and browser delegates URL api', () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const browser = new BrowserObjectUrlService();
    const noop = new NoopObjectUrlService();

    const url = browser.create(new Blob(['a']));
    browser.revoke(url);

    expect(url).toBe('blob:test-url');
    expect(noop.create()).toBe('');

    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});
