import { PLATFORM_ID, computed, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { RecordingsRepository } from '../../../infrastructure/recording/recordings.repository';

interface RecordingItem {
  id: string;
  title: string;
  durationSeconds: number;
  createdAtLabel: string;
  createdAtMs: number;
  audioUrl: string;
  mimeType: string;
}

interface RecordingsState {
  items: RecordingItem[];
  selectedId: string | null;
}

const initialState: RecordingsState = {
  items: [],
  selectedId: null,
};

export const RecordingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items, selectedId }) => ({
    isEmpty: computed(() => items().length === 0),
    selected: computed(() => items().find((item) => item.id === selectedId()) ?? null),
  })),
  withMethods((store) => {
    const platformId = inject(PLATFORM_ID),
      repository = isPlatformBrowser(platformId) ? new RecordingsRepository() : null,
      toRecordingItem = (entry: {
        id: string;
        title: string;
        durationSeconds: number;
        createdAtLabel: string;
        mimeType: string;
        blob: Blob;
        createdAtMs?: number;
      }): RecordingItem => {
        const createdAtMs = typeof entry.createdAtMs === 'number' ? entry.createdAtMs : Date.now();
        return {
          id: entry.id,
          title: entry.title,
          durationSeconds: entry.durationSeconds,
          createdAtLabel: entry.createdAtLabel,
          createdAtMs,
          audioUrl: URL.createObjectURL(entry.blob),
          mimeType: entry.mimeType,
        };
      },
      sortByDateDesc = (items: RecordingItem[]) =>
        [...items].sort((a, b) => b.createdAtMs - a.createdAtMs);

    return {
      async load(): Promise<void> {
        if (!repository) {
          return;
        }
        const entries = await repository.getAll();
        patchState(store, (state) => {
          state.items.forEach((item) => {
            URL.revokeObjectURL(item.audioUrl);
          });
          return {
            items: sortByDateDesc(entries.map(toRecordingItem)),
            selectedId: null,
          };
        });
      },
      add(item: RecordingItem, blob: Blob): void {
        patchState(store, (state) => ({
          items: sortByDateDesc([item, ...state.items]),
        }));
        if (repository) {
          void repository.put({
            id: item.id,
            title: item.title,
            durationSeconds: item.durationSeconds,
            createdAtLabel: item.createdAtLabel,
            createdAtMs: item.createdAtMs,
            mimeType: item.mimeType,
            blob,
          });
        }
      },
      remove(id: string): void {
        patchState(store, (state) => {
          const nextItems = state.items.filter((item) => item.id !== id),
            removed = state.items.find((item) => item.id === id);
          if (removed) {
            URL.revokeObjectURL(removed.audioUrl);
          }
          return {
            items: nextItems,
            selectedId: state.selectedId === id ? null : state.selectedId,
          };
        });
        if (repository) {
          void repository.remove(id);
        }
      },
      select(id: string | null): void {
        patchState(store, { selectedId: id });
      },
      clear(): void {
        patchState(store, (state) => {
          state.items.forEach((item) => {
            URL.revokeObjectURL(item.audioUrl);
          });
          return { items: [], selectedId: null };
        });
        if (repository) {
          void repository.clear();
        }
      },
    };
  }),
);

export type RecordingsStore = InstanceType<typeof RecordingsStore>;
