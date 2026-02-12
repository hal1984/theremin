import { describe, expect, it, vi } from 'vitest';

import { clearRecordingsUseCase } from './clear-recordings.use-case';
import { loadRecordingsUseCase } from './load-recordings.use-case';
import { removeRecordingUseCase } from './remove-recording.use-case';
import { selectRecordingUseCase } from './select-recording.use-case';

describe('recordings use-cases', () => {
  it('loads and sorts recordings by date desc', async () => {
    const repository = {
        getAll: vi.fn(async () => [
          {
            id: 'old',
            title: 'old',
            durationSeconds: 1,
            createdAtLabel: 'old',
            createdAtMs: 10,
            mimeType: 'audio/webm',
            blob: new Blob(['old']),
          },
          {
            id: 'new',
            title: 'new',
            durationSeconds: 1,
            createdAtLabel: 'new',
            createdAtMs: 20,
            mimeType: 'audio/webm',
            blob: new Blob(['new']),
          },
        ]),
        put: vi.fn(async () => undefined),
        remove: vi.fn(async () => undefined),
        clear: vi.fn(async () => undefined),
      },
      objectUrl = {
        create: vi.fn((blob: Blob) => `blob:${blob.size}`),
        revoke: vi.fn(),
      };

    const result = await loadRecordingsUseCase(repository, objectUrl);

    expect(result.map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('removes recording and clears selection when needed', () => {
    const result = removeRecordingUseCase(
      [
        {
          id: 'a',
          title: 'a',
          durationSeconds: 1,
          createdAtLabel: 'a',
          createdAtMs: 1,
          audioUrl: 'blob:a',
          mimeType: 'audio/webm',
        },
        {
          id: 'b',
          title: 'b',
          durationSeconds: 1,
          createdAtLabel: 'b',
          createdAtMs: 2,
          audioUrl: 'blob:b',
          mimeType: 'audio/webm',
        },
      ],
      'b',
      'b',
    );

    expect(result.selectedId).toBeNull();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('a');
  });

  it('keeps select/clear behaviors pure', () => {
    expect(selectRecordingUseCase('abc')).toBe('abc');
    expect(clearRecordingsUseCase()).toEqual({ items: [], selectedId: null });
  });
});
