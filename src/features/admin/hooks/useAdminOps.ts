'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminOrderStatusPatch,
  AdminOrderBulkStatus,
  AdminUserWrite,
} from '@/shared/contracts/admin-ops.contract';
import {
  adminOrdersService,
  adminStatsService,
  adminUsersService,
  type AdminOrderListParams,
  type AdminUserListParams,
} from '../services/admin-ops.service';

export const adminOpsKeys = {
  stats: () => ['admin', 'stats'] as const,
  orders: (params: AdminOrderListParams) =>
    ['admin', 'orders', params] as const,
  order: (id: string) => ['admin', 'orders', id] as const,
  users: (params: AdminUserListParams) => ['admin', 'users', params] as const,
  user: (id: string) => ['admin', 'users', id] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: adminOpsKeys.stats(),
    queryFn: () => adminStatsService.get(),
  });
}

export function useOrdersNeedingAction(): number {
  const { data } = useAdminStats();
  if (!data?.ordersByStatus) return 0;
  const placed = data.ordersByStatus.placed ?? 0;
  const confirmed = data.ordersByStatus.confirmed ?? 0;
  return placed + confirmed;
}

export function useAdminOrders(params: AdminOrderListParams) {
  return useQuery({
    queryKey: adminOpsKeys.orders(params),
    queryFn: () => adminOrdersService.list(params),
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: adminOpsKeys.order(id),
    queryFn: () => adminOrdersService.get(id),
    enabled: Boolean(id),
  });
}

export function useUpdateAdminOrderStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminOrderStatusPatch) =>
      adminOrdersService.updateStatus(id, input),
    onSuccess: (order) => {
      qc.setQueryData(adminOpsKeys.order(id), order);
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useBulkUpdateAdminOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminOrderBulkStatus) =>
      adminOrdersService.bulkUpdateStatus(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}


export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: adminOpsKeys.users(params),
    queryFn: () => adminUsersService.list(params),
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminOpsKeys.user(id),
    queryFn: () => adminUsersService.get(id),
    enabled: Boolean(id),
  });
}

export function useUpdateAdminUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminUserWrite) => adminUsersService.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: adminOpsKeys.user(id) });
    },
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminUsersService.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
