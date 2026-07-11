'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedAddress {
  id: string;
  label: string;
  governorate: string;
  city: string;
  street: string;
}

interface AddressesState {
  addresses: SavedAddress[];
  addAddress: (address: Omit<SavedAddress, 'id'>) => void;
  removeAddress: (id: string) => void;
}

export const useAddressesStore = create<AddressesState>()(
  persist(
    (set) => ({
      addresses: [],
      addAddress: (address) =>
        set((state) => ({
          addresses: [
            ...state.addresses,
            { ...address, id: `addr-${Date.now().toString(36)}` },
          ],
        })),
      removeAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
        })),
    }),
    { name: 'Zaya-addresses' },
  ),
);
