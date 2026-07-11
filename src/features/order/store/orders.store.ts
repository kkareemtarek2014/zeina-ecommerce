'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order } from '@/shared/types/order.types';

interface OrdersState {
  orders: Order[];
  placeOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Order;
  getOrder: (id: string) => Order | undefined;
}

function generateOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ZN-${stamp}-${random}`;
}

/**
 * Client-side order log — stands in for the backend orders API.
 * When the dashboard/backend exists, placeOrder() will POST instead.
 */
export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],

      placeOrder: (draft) => {
        const order: Order = {
          ...draft,
          id: generateOrderId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ orders: [order, ...state.orders] }));
        return order;
      },

      getOrder: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: 'Zaya-orders' },
  ),
);
