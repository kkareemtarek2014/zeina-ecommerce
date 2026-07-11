import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/shared/types/product.types';

interface RecentlyViewedState {
  viewedProducts: Product[];
  addProduct: (product: Product) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      viewedProducts: [],
      addProduct: (product) =>
        set((state) => {
          const filtered = state.viewedProducts.filter((p) => p.id !== product.id);
          return { viewedProducts: [product, ...filtered].slice(0, 10) };
        }),
    }),
    {
      name: 'Zaya-recently-viewed',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
