'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppError } from '@/shared/contracts/errors';
import type { UserDTO } from '@/shared/contracts/auth.contract';
import type {
  ForgotPasswordValues,
  LoginValues,
  RegisterValues,
} from '../schema/auth.schema';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';

export const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export function useSession() {
  const setSession = useAuthStore((s) => s.setSession);

  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async (): Promise<UserDTO | null> => {
      try {
        return await authService.me();
      } catch (err) {
        if (err instanceof AppError && err.code === 'UNAUTHORIZED') {
          return null;
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.isFetched) {
      setSession(query.data ?? null);
    }
  }, [query.isFetched, query.data, setSession]);

  return query;
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: LoginValues) =>
      authService.login(values.email, values.password),
    onSuccess: (user) => {
      login(user);
      qc.setQueryData(SESSION_QUERY_KEY, user);
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: RegisterValues) =>
      authService.register(values.email, values.name, values.password),
    onSuccess: (user) => {
      login(user);
      qc.setQueryData(SESSION_QUERY_KEY, user);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (values: ForgotPasswordValues) =>
      authService.resetPassword(values.email),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      qc.setQueryData(SESSION_QUERY_KEY, null);
    },
  });
}
