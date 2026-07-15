'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  WishlistAlertDTO,
  WishlistAlertToggleInput,
} from '@/shared/contracts/wishlist-alerts.contract';
import { api } from '@/shared/lib/api-client';

export const wishlistAlertKeys = {
  all: ['account', 'wishlist-alerts'] as const,
};

export function useWishlistAlerts(enabled: boolean) {
  return useQuery({
    queryKey: wishlistAlertKeys.all,
    queryFn: () => api.get<WishlistAlertDTO[]>('/api/account/wishlist-alerts'),
    enabled,
  });
}

export function useToggleWishlistAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WishlistAlertToggleInput) =>
      api.put<WishlistAlertDTO>('/api/account/wishlist-alerts', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: wishlistAlertKeys.all });
    },
  });
}
