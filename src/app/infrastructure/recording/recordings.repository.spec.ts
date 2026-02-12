import { describe, expect, it, vi, beforeEach } from 'vitest';

import { NoopRecordingsRepository, RecordingsRepository } from './recordings.repository';

const dbData = new Map<string, unknown>();

const createRequest = <T>(result: T, shouldError = false): IDBRequest<T> => {
  const req = { result, error: shouldError ? new Error('idb') : null } as unknown as IDBRequest<T>;
  setTimeout(() => {
    if (shouldError) {
      req.onerror?.({} as Event);
      return;
    }
    req.onsuccess?.({} as Event);
  }, 0);
  return req;
};

beforeEach(() => {
  dbData.clear();

  vi.stubGlobal('indexedDB', {
    open: vi.fn(() => {
      const request = {} as IDBOpenDBRequest;
      const store = {
        getAll: () => createRequest(Array.from(dbData.values()) as unknown[]),
        put: (value: unknown & { id: string }) => {
          dbData.set(value.id, value);
          return createRequest(value);
        },
        delete: (id: string) => {
          dbData.delete(id);
          return createRequest(undefined);
        },
        clear: () => {
          dbData.clear();
          return createRequest(undefined);
        },
      } as unknown as IDBObjectStore;

      const db = {
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
        transaction: () => ({ objectStore: () => store }),
      } as unknown as IDBDatabase;

      setTimeout(() => {
        (request as { result: IDBDatabase }).result = db;
        request.onsuccess?.({} as Event);
      }, 0);

      return request;
    }),
  });
});

describe('RecordingsRepository', () => {
  it('performs get/put/remove/clear transactions', async () => {
    const repo = new RecordingsRepository();
    await repo.put({
      id: '1',
      title: 'Test',
      durationSeconds: 1,
      createdAtLabel: 'now',
      createdAtMs: 1,
      mimeType: 'audio/webm',
      blob: new Blob(['a'], { type: 'audio/webm' }),
    });

    const all = await repo.getAll();
    expect(all).toHaveLength(1);

    await repo.remove('1');
    expect(await repo.getAll()).toHaveLength(0);

    await repo.put({
      id: '2',
      title: 'Again',
      durationSeconds: 2,
      createdAtLabel: 'now',
      createdAtMs: 2,
      mimeType: 'audio/webm',
      blob: new Blob(['b'], { type: 'audio/webm' }),
    });
    await repo.clear();
    expect(await repo.getAll()).toHaveLength(0);
  });

  it('noop repository contract', async () => {
    const repo = new NoopRecordingsRepository();
    expect(await repo.getAll()).toEqual([]);
    await repo.put();
    await repo.remove();
    await repo.clear();
  });

  it('rejects when database open fails', async () => {
    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => {
        const request = { error: new Error('open failed') } as IDBOpenDBRequest;
        setTimeout(() => {
          request.onerror?.({} as Event);
        }, 0);
        return request;
      }),
    });

    const repo = new RecordingsRepository();
    await expect(repo.getAll()).rejects.toBeTruthy();
  });

  it('creates object store on upgrade when missing', async () => {
    const createObjectStore = vi.fn();
    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => {
        const request = {} as IDBOpenDBRequest;
        const store = {
          getAll: () => createRequest([]),
        } as unknown as IDBObjectStore;
        const db = {
          objectStoreNames: { contains: () => false },
          createObjectStore,
          transaction: () => ({ objectStore: () => store }),
        } as unknown as IDBDatabase;

        setTimeout(() => {
          (request as { result: IDBDatabase }).result = db;
          request.onupgradeneeded?.({} as IDBVersionChangeEvent);
          request.onsuccess?.({} as Event);
        }, 0);

        return request;
      }),
    });

    const repo = new RecordingsRepository();
    await repo.getAll();
    expect(createObjectStore).toHaveBeenCalledWith('recordings', { keyPath: 'id' });
  });
});
