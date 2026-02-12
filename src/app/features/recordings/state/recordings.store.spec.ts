import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it, vi } from 'vitest';

import { OBJECT_URL } from '../../../core/di/tokens/platform.token';
import { RECORDINGS_REPOSITORY } from '../../../core/di/tokens/recordings-repository.token';
import { RecordingsStore } from './recordings.store';

describe('RecordingsStore', () => {
  const repository = {
      getAll: vi.fn(),
      put: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    objectUrl = {
      create: vi.fn(),
      revoke: vi.fn(),
    };

  beforeEach(() => {
    repository.getAll.mockReset();
    repository.put.mockReset();
    repository.remove.mockReset();
    repository.clear.mockReset();
    objectUrl.create.mockReset();
    objectUrl.revoke.mockReset();

    TestBed.configureTestingModule({
      providers: [
        { provide: RECORDINGS_REPOSITORY, useValue: repository },
        { provide: OBJECT_URL, useValue: objectUrl },
      ],
    });
  });

  it('loads recordings through repository/object-url ports', async () => {
    repository.getAll.mockResolvedValue([
      {
        id: '1',
        title: 'Session',
        durationSeconds: 3,
        createdAtLabel: 'Today',
        createdAtMs: 10,
        mimeType: 'audio/webm',
        blob: new Blob(['a']),
      },
    ]);
    objectUrl.create.mockReturnValue('blob:1');

    const store = TestBed.inject(RecordingsStore);
    await store.load();

    expect(repository.getAll).toHaveBeenCalledTimes(1);
    expect(objectUrl.create).toHaveBeenCalledTimes(1);
    expect(store.items()).toHaveLength(1);
    expect(store.items()[0]?.audioUrl).toBe('blob:1');
  });

  it('revokes URL and removes recording through ports', () => {
    repository.put.mockResolvedValue(undefined);
    repository.remove.mockResolvedValue(undefined);

    const store = TestBed.inject(RecordingsStore);
    store.add(
      {
        id: '1',
        title: 'Session',
        durationSeconds: 3,
        createdAtLabel: 'Today',
        createdAtMs: 10,
        audioUrl: 'blob:1',
        mimeType: 'audio/webm',
      },
      new Blob(['a']),
    );

    store.remove('1');

    expect(objectUrl.revoke).toHaveBeenCalledWith('blob:1');
    expect(repository.remove).toHaveBeenCalledWith('1');
  });

  it('selects and clears recordings with object-url revoke', () => {
    repository.put.mockResolvedValue(undefined);
    repository.clear.mockResolvedValue(undefined);

    const store = TestBed.inject(RecordingsStore);
    store.add(
      {
        id: '1',
        title: 'Session',
        durationSeconds: 3,
        createdAtLabel: 'Today',
        createdAtMs: 10,
        audioUrl: 'blob:1',
        mimeType: 'audio/webm',
      },
      new Blob(['a']),
    );
    store.select('1');
    expect(store.selectedId()).toBe('1');
    expect(store.selected()?.id).toBe('1');

    store.clear();
    expect(objectUrl.revoke).toHaveBeenCalledWith('blob:1');
    expect(repository.clear).toHaveBeenCalledTimes(1);
    expect(store.isEmpty()).toBe(true);
  });
});
