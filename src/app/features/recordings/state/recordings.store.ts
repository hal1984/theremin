import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import type { RecordingItem } from '../../../application/models/recording.model';
import { clearRecordingsUseCase } from '../../../application/use-cases/recordings/clear-recordings.use-case';
import { loadRecordingsUseCase } from '../../../application/use-cases/recordings/load-recordings.use-case';
import { removeRecordingUseCase } from '../../../application/use-cases/recordings/remove-recording.use-case';
import { selectRecordingUseCase } from '../../../application/use-cases/recordings/select-recording.use-case';
import { OBJECT_URL } from '../../../core/di/tokens/platform.token';
import { RECORDINGS_REPOSITORY } from '../../../core/di/tokens/recordings-repository.token';

interface RecordingsState {
  items: RecordingItem[];
  selectedId: string | null;
}

const initialState: RecordingsState = {
  items: [],
  selectedId: null,
};

const sortByDateDesc = (items: RecordingItem[]): RecordingItem[] =>
  [...items].sort((a, b) => b.createdAtMs - a.createdAtMs);

export const RecordingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items, selectedId }) => ({
    isEmpty: computed(() => items().length === 0),
    selected: computed(() => items().find((item) => item.id === selectedId()) ?? null),
  })),
  withMethods((store) => {
    const repository = inject(RECORDINGS_REPOSITORY),
      objectUrl = inject(OBJECT_URL);

    return {
      async load(): Promise<void> {
        const loaded = await loadRecordingsUseCase(repository, objectUrl);
        const currentItems = store.items();
        currentItems.forEach((item) => {
          objectUrl.revoke(item.audioUrl);
        });

        patchState(store, {
          items: loaded,
          selectedId: null,
        });
      },
      add(item: RecordingItem, blob: Blob): void {
        patchState(store, {
          items: sortByDateDesc([item, ...store.items()]),
        });

        void repository.put({
          id: item.id,
          title: item.title,
          durationSeconds: item.durationSeconds,
          createdAtLabel: item.createdAtLabel,
          createdAtMs: item.createdAtMs,
          mimeType: item.mimeType,
          blob,
        });
      },
      remove(id: string): void {
        const currentItems = store.items(),
          currentSelectedId = store.selectedId(),
          removed = currentItems.find((item) => item.id === id),
          nextState = removeRecordingUseCase(currentItems, currentSelectedId, id);

        if (removed) {
          objectUrl.revoke(removed.audioUrl);
        }

        patchState(store, nextState);
        void repository.remove(id);
      },
      select(id: string | null): void {
        patchState(store, { selectedId: selectRecordingUseCase(id) });
      },
      clear(): void {
        store.items().forEach((item) => {
          objectUrl.revoke(item.audioUrl);
        });

        patchState(store, clearRecordingsUseCase());
        void repository.clear();
      },
    };
  }),
);

export type RecordingsStore = InstanceType<typeof RecordingsStore>;
