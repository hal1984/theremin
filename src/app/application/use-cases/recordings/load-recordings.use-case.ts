import type { RecordingItem } from '../../models/recording.model';
import type { ObjectUrlPort } from '../../ports/object-url.port';
import type {
  RecordingsRepositoryPort,
  StoredRecording,
} from '../../ports/recordings-repository.port';

const toRecordingItem = (entry: StoredRecording, objectUrl: ObjectUrlPort): RecordingItem => ({
    id: entry.id,
    title: entry.title,
    durationSeconds: entry.durationSeconds,
    createdAtLabel: entry.createdAtLabel,
    createdAtMs: entry.createdAtMs,
    audioUrl: objectUrl.create(entry.blob),
    mimeType: entry.mimeType,
  }),
  sortByDateDesc = (items: RecordingItem[]) =>
    [...items].sort((a, b) => b.createdAtMs - a.createdAtMs);

export const loadRecordingsUseCase = async (
  repository: RecordingsRepositoryPort,
  objectUrl: ObjectUrlPort,
): Promise<RecordingItem[]> => {
  const entries = await repository.getAll();
  return sortByDateDesc(entries.map((entry) => toRecordingItem(entry, objectUrl)));
};
