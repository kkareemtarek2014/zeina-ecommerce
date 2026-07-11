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
  couponCode: string | null;
  discountPercentage: number;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      couponCode: null,
      discountPercentage: 0,

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

      applyCoupon: (code) => {
        // Mock coupon logic: ZAYA10 gives 10% off, ZAYA20 gives 20% off
        const validCoupons: Record<string, number> = {
          'ZAYA10': 10,
          'ZAYA20': 20,
        };
        const upperCode = code.toUpperCase();
        if (validCoupons[upperCode]) {
          set({ couponCode: upperCode, discountPercentage: validCoupons[upperCode] });
        } else {
          // If invalid, we could optionally handle error state, for now just ignore or reset
          set({ couponCode: null, discountPercentage: 0 });
        }
      },

      removeCoupon: () => set({ couponCode: null, discountPercentage: 0 }),

      clear: () => set({ items: [], couponCode: null, discountPercentage: 0 }),
    }),
    {
      name: 'Zaya-cart',
      partialize: (state) => ({ items: state.items, couponCode: state.couponCode, discountPercentage: state.discountPercentage }),
    },
  ),
);

export const selectCartCount = (state: CartState): number =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartSubtotal = (state: CartState): number =>
  state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

export const selectCartDiscount = (state: CartState): number => {
  const subtotal = selectCartSubtotal(state);
  return (subtotal * state.discountPercentage) / 100;
};

export const selectCartTotal = (state: CartState): number => {
  const subtotal = selectCartSubtotal(state);
  const discount = selectCartDiscount(state);
  return subtotal - discount;
};
