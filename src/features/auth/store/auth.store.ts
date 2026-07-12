'use client';

import { create } from 'zustand';
import type { UserDTO } from '@/shared/contracts/auth.contract';

interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  /** True once /api/auth/me has resolved (success or 401). */
  sessionChecked: boolean;
  setSession: (user: UserDTO | null) => void;
  login: (user: UserDTO) => void;
  logout: () => void;
}

/**
 * Client auth mirror of the httpOnly session cookie.
 * Not persisted — hydrate exclusively via GET /api/auth/me.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  sessionChecked: false,
  setSession: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
      sessionChecked: true,
    }),
  login: (user) =>
    set({
      user,
      isAuthenticated: true,
      sessionChecked: true,
    }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      sessionChecked: true,
    }),
}));
