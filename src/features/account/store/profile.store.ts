'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Profile {
  fullName: string;
  phone: string;
  email: string;
}

interface ProfileState {
  profile: Profile;
  updateProfile: (profile: Profile) => void;
}

/** Local profile — replaced by real auth/user API later. */
export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: { fullName: '', phone: '', email: '' },
      updateProfile: (profile) => set({ profile }),
    }),
    { name: 'Zaya-profile' },
  ),
);
