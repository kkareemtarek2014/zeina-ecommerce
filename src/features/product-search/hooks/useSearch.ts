'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { searchProducts } from '@/features/shop/services/products.service';

/* ── Recent searches (persisted) ─────────────────────────── */

interface RecentSearchesState {
  recent: string[];
  save: (term: string) => void;
  clear: () => void;
}

export const useRecentSearches = create<RecentSearchesState>()(
  persist(
    (set) => ({
      recent: [],
      save: (term) =>
        set((state) => ({
          recent: [
            term,
            ...state.recent.filter((t) => t !== term),
          ].slice(0, 6),
        })),
      clear: () => set({ recent: [] }),
    }),
    { name: 'Sqoosh-recent-searches' },
  ),
);

/* ── Debounced search ────────────────────────────────────── */

export function useSearch() {
  const [value, setValue] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 250);
    return () => clearTimeout(t);
  }, [value]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchProducts(debounced),
    enabled: debounced.trim().length > 0,
  });

  return { value, setValue, results, isLoading: isFetching };
}
