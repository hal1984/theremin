import type { RecordingItem } from '../../models/recording.model';

export interface RemoveRecordingResult {
  items: RecordingItem[];
  selectedId: string | null;
}

export const removeRecordingUseCase = (
  items: RecordingItem[],
  selectedId: string | null,
  id: string,
): RemoveRecordingResult => {
  const nextItems = items.filter((item) => item.id !== id);

  return {
    items: nextItems,
    selectedId: selectedId === id ? null : selectedId,
  };
};
