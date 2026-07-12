import { api } from '@/shared/lib/api-client';
import type { UserDTO } from '@/shared/contracts/auth.contract';

/**
 * Auth service — bodies call the Cloudflare API.
 * Session is an httpOnly cookie; never store tokens client-side.
 */
export const authService = {
  login(email: string, password: string): Promise<UserDTO> {
    return api.post<UserDTO>('/api/auth/login', { email, password });
  },

  register(email: string, name: string, password: string): Promise<UserDTO> {
    return api.post<UserDTO>('/api/auth/register', { name, email, password });
  },

  resetPassword(email: string): Promise<{ ok: true }> {
    return api.post<{ ok: true }>('/api/auth/forgot-password', { email });
  },

  logout(): Promise<{ ok: true }> {
    return api.post<{ ok: true }>('/api/auth/logout');
  },

  me(): Promise<UserDTO> {
    return api.get<UserDTO>('/api/auth/me');
  },
};
