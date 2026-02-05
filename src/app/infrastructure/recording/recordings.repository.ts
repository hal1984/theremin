export type StoredRecording = {
  id: string;
  title: string;
  durationSeconds: number;
  createdAtLabel: string;
  createdAtMs: number;
  mimeType: string;
  blob: Blob;
};

const DB_NAME = 'theremin-recordings';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => void,
  finalize: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDatabase();
  return await new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    handler(store);
    const request = finalize(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export class RecordingsRepository {
  async getAll(): Promise<StoredRecording[]> {
    return await runTransaction<StoredRecording[]>(
      'readonly',
      () => undefined,
      (store) => store.getAll()
    );
  }

  async put(recording: StoredRecording): Promise<void> {
    await runTransaction(
      'readwrite',
      () => undefined,
      (store) => store.put(recording)
    );
  }

  async remove(id: string): Promise<void> {
    await runTransaction(
      'readwrite',
      () => undefined,
      (store) => store.delete(id)
    );
  }

  async clear(): Promise<void> {
    await runTransaction(
      'readwrite',
      () => undefined,
      (store) => store.clear()
    );
  }
}
