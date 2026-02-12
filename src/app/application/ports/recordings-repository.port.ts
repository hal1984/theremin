export interface StoredRecording {
  id: string;
  title: string;
  durationSeconds: number;
  createdAtLabel: string;
  createdAtMs: number;
  mimeType: string;
  blob: Blob;
}

export interface RecordingsRepositoryPort {
  getAll: () => Promise<StoredRecording[]>;
  put: (recording: StoredRecording) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}
