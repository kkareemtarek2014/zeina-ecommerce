'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Wishlist / favorites store (guest + optimistic UI).
 * Guests persist to `Sqoosh-favorites`. On login, ids are PUT to
 * `/api/account/favorites`; while authenticated, toggles PUT the set too.
 */
interface FavoritesState {
  ids: string[];
  setIds: (ids: string[]) => void;
  toggle: (productId: string) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      setIds: (ids) => set({ ids: [...new Set(ids)] }),
      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        })),
      add: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids
            : [...state.ids, productId],
        })),
      remove: (productId) =>
        set((state) => ({
          ids: state.ids.filter((id) => id !== productId),
        })),
      isFavorite: (productId) => get().ids.includes(productId),
      clear: () => set({ ids: [] }),
    }),
    { name: 'Sqoosh-favorites' },
  ),
);

/** Selector: total number of saved items. */
export const selectFavoritesCount = (state: FavoritesState): number =>
  state.ids.length;
