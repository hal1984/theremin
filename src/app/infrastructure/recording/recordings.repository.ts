import type {
  RecordingsRepositoryPort,
  StoredRecording,
} from '../../application/ports/recordings-repository.port';

const DB_NAME = 'theremin-recordings',
  STORE_NAME = 'recordings',
  DB_VERSION = 1,
  openDatabase = async (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    }),
  runTransaction = async <T>(
    mode: IDBTransactionMode,
    handler: (store: IDBObjectStore) => void,
    finalize: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> => {
    const db = await openDatabase();
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode),
        store = transaction.objectStore(STORE_NAME);
      handler(store);
      const request = finalize(store);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  };

export class RecordingsRepository implements RecordingsRepositoryPort {
  async getAll(): Promise<StoredRecording[]> {
    return runTransaction<StoredRecording[]>(
      'readonly',
      () => undefined,
      (store) => store.getAll(),
    );
  }

  async put(recording: StoredRecording): Promise<void> {
    await runTransaction(
      'readwrite',
      () => undefined,
      (store) => store.put(recording),
    );
  }

  async remove(id: string): Promise<void> {
    await runTransaction(
      'readwrite',
      () => undefined,
      (store) => store.delete(id),
    );
  }

  async clear(): Promise<void> {
    await runTransaction(
      'readwrite',
      () => undefined,
      (store) => store.clear(),
    );
  }
}

export class NoopRecordingsRepository implements RecordingsRepositoryPort {
  async getAll(): Promise<StoredRecording[]> {
    return [];
  }

  async put(): Promise<void> {
    void 0;
  }

  async remove(): Promise<void> {
    void 0;
  }

  async clear(): Promise<void> {
    void 0;
  }
}
