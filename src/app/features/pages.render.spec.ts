import { PLATFORM_ID } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockBuilder, MockRender, MockProvider } from 'ng-mocks';

import { CONFIRMATION } from '../core/di/tokens/platform.token';
import { AboutPage } from './about/page/about.page';
import { RecordingsPage } from './recordings/page/recordings.page';
import { RecordingsStore } from './recordings/state/recordings.store';
import { SettingsPage } from './settings/page/settings.page';
import { SettingsStore } from './settings/state/settings.store';

describe('Pages render', () => {
  it('renders about page template', async () => {
    await MockBuilder(AboutPage).mock(TranslatePipe, (value: string) => value);
    const fixture = MockRender(AboutPage);
    expect((fixture.nativeElement.textContent as string).length).toBeGreaterThan(0);
  });

  describe('settings page', () => {
    const settingsStore = {
      minHz: () => 40,
      maxHz: () => 600,
      smoothingMs: () => 20,
      swapHands: () => false,
      quantize: () => true,
      volumeCurve: () => 'expo',
      setRange: vi.fn(),
      setSmoothing: vi.fn(),
      toggleSwapHands: vi.fn(),
      toggleQuantize: vi.fn(),
      setVolumeCurve: vi.fn(),
      swapHandsLabelKey: () => 'COMMON.NO',
      quantizeLabelKey: () => 'COMMON.YES',
    } as unknown as SettingsStore;

    beforeEach(async () => {
      await MockBuilder(SettingsPage)
        .mock(TranslatePipe, (value: string) => value)
        .provide(MockProvider(SettingsStore, settingsStore))
        .provide({ provide: PLATFORM_ID, useValue: 'browser' });
    });

    it('renders and executes nudge/toggle actions', () => {
      const fixture = MockRender(SettingsPage);
      const page = fixture.point.componentInstance;

      page.nudgeRange(10);
      page.nudgeSmoothing(5);
      page.toggleSwapHands();
      page.toggleQuantize();

      expect(settingsStore.setRange).toHaveBeenCalled();
      expect(settingsStore.setSmoothing).toHaveBeenCalledWith(25);
      expect(settingsStore.toggleSwapHands).toHaveBeenCalled();
      expect(settingsStore.toggleQuantize).toHaveBeenCalled();
    });
  });

  describe('recordings page', () => {
    const recordingsStore = {
      items: () => [],
      selectedId: () => null,
      selected: () => null,
      isEmpty: () => true,
      load: vi.fn(async () => undefined),
      select: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    } as unknown as RecordingsStore;

    const confirmation = { confirm: vi.fn(() => true) };

    beforeEach(async () => {
      confirmation.confirm.mockReset();
      confirmation.confirm.mockReturnValue(true);
      (recordingsStore.load as unknown as ReturnType<typeof vi.fn>).mockReset();
      (recordingsStore.load as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (recordingsStore.select as unknown as ReturnType<typeof vi.fn>).mockReset();
      (recordingsStore.remove as unknown as ReturnType<typeof vi.fn>).mockReset();
      (recordingsStore.clear as unknown as ReturnType<typeof vi.fn>).mockReset();

      await MockBuilder(RecordingsPage)
        .mock(TranslatePipe, (value: string) => value)
        .provide(MockProvider(RecordingsStore, recordingsStore))
        .provide({ provide: CONFIRMATION, useValue: confirmation })
        .provide({ provide: PLATFORM_ID, useValue: 'browser' })
        .provide({
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        });
    });

    it('renders and delegates select/remove/clear', () => {
      const fixture = MockRender(RecordingsPage);
      const page = fixture.point.componentInstance;

      page.select('id-1');
      page.remove('id-2');
      page.clear();

      expect(recordingsStore.load).toHaveBeenCalled();
      expect(recordingsStore.select).toHaveBeenCalledWith('id-1');
      expect(recordingsStore.remove).toHaveBeenCalledWith('id-2');
      expect(recordingsStore.clear).toHaveBeenCalled();
    });

    it('does not remove/clear when confirmation is false', () => {
      confirmation.confirm.mockReturnValue(false);
      const fixture = MockRender(RecordingsPage);
      const page = fixture.point.componentInstance;

      page.remove('id-3');
      page.clear();

      expect(recordingsStore.remove).not.toHaveBeenCalled();
      expect(recordingsStore.clear).not.toHaveBeenCalled();
    });
  });
});
