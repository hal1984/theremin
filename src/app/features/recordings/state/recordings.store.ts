import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

type RecordingItem = {
  id: string;
  title: string;
  durationSeconds: number;
  createdAtLabel: string;
};

type RecordingsState = {
  items: RecordingItem[];
  selectedId: string | null;
};

const initialState: RecordingsState = {
  items: [],
  selectedId: null
};

export const RecordingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items, selectedId }) => ({
    isEmpty: computed(() => items().length === 0),
    selected: computed(() => items().find((item) => item.id === selectedId()) ?? null)
  })),
  withMethods((store) => ({
    add(item: RecordingItem): void {
      patchState(store, (state) => ({ items: [...state.items, item] }));
    },
    remove(id: string): void {
      patchState(store, (state) => ({
        items: state.items.filter((item) => item.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId
      }));
    },
    select(id: string | null): void {
      patchState(store, { selectedId: id });
    },
    clear(): void {
      patchState(store, { items: [], selectedId: null });
    }
  }))
);

export type RecordingsStore = InstanceType<typeof RecordingsStore>;
