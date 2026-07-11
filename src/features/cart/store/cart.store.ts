'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/shared/types/product.types';
import { getSellPrice } from '@/shared/utils/price';

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  unitPrice: number; // Selling price (margin already applied)
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),

      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === product.id,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, 10) }
                  : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                image: product.images[0] ?? '',
                unitPrice: getSellPrice(product.basePrice),
                quantity,
              },
            ],
            isOpen: true,
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'Zaya-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const selectCartCount = (state: CartState): number =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartSubtotal = (state: CartState): number =>
  state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
