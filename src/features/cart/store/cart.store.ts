'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/shared/types/product.types';
import { api } from '@/shared/lib/api-client';
import type { ValidatePromoResult } from '@/shared/contracts/promo.contract';

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
  couponCode: string | null;
  /** Discount from last successful API validate (integer EGP). */
  couponDiscount: number;
  note: string;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
  setNote: (note: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: null,
      couponDiscount: 0,
      note: '',

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
                unitPrice: product.price,
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

      applyCoupon: async (code) => {
        const subtotal = selectCartSubtotal(get());
        try {
          const result = await api.post<ValidatePromoResult>(
            '/api/promos/validate',
            { code, subtotal },
          );
          if (result.valid) {
            set({
              couponCode: code.toUpperCase(),
              couponDiscount: result.discount ?? 0,
            });
            return { success: true };
          }
          return { success: false, error: result.error ?? 'Invalid promo code' };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Invalid promo code',
          };
        }
      },

      removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),

      setNote: (note: string) => set({ note }),

      clear: () =>
        set({ items: [], couponCode: null, couponDiscount: 0, note: '' }),
    }),
    {
      name: 'Sqoosh-cart',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
        note: state.note,
      }),
    },
  ),
);

export const selectCartCount = (state: CartState): number =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartSubtotal = (state: CartState): number =>
  state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

export const selectCartDiscount = (state: CartState): number => {
  if (!state.couponCode) return 0;
  return state.couponDiscount;
};

export const selectCartTotal = (state: CartState): number => {
  const subtotal = selectCartSubtotal(state);
  const discount = selectCartDiscount(state);
  return Math.max(0, subtotal - discount);
};
