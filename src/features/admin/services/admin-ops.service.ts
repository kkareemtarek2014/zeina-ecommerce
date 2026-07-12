import { api } from '@/shared/lib/api-client';
import type {
  AdminOrderDTO,
  AdminOrderStatusPatch,
  AdminUserDetailDTO,
  AdminUserDTO,
  AdminUserWrite,
  OrderStatus,
} from '@/shared/contracts/admin-ops.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';
import type { AdminStatsDTO } from '@/shared/contracts/admin-stats.contract';

export type AdminOrderListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: OrderStatus;
  governorate?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AdminUserListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: 'customer' | 'admin';
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export const adminOrdersService = {
  list(params: AdminOrderListParams = {}): Promise<Paginated<AdminOrderDTO>> {
    return api.get(
      `/api/admin/orders${toQuery({
        page: params.page,
        pageSize: params.pageSize,
        q: params.q,
        status: params.status,
        governorate: params.governorate,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      })}`,
    );
  },

  get(id: string): Promise<AdminOrderDTO> {
    return api.get(`/api/admin/orders/${encodeURIComponent(id)}`);
  },

  updateStatus(
    id: string,
    input: AdminOrderStatusPatch,
  ): Promise<AdminOrderDTO> {
    return api.patch(
      `/api/admin/orders/${encodeURIComponent(id)}/status`,
      input,
    );
  },
};

export const adminUsersService = {
  list(params: AdminUserListParams = {}): Promise<Paginated<AdminUserDTO>> {
    return api.get(
      `/api/admin/users${toQuery({
        page: params.page,
        pageSize: params.pageSize,
        q: params.q,
        role: params.role,
      })}`,
    );
  },

  get(id: string): Promise<AdminUserDetailDTO> {
    return api.get(`/api/admin/users/${encodeURIComponent(id)}`);
  },

  update(id: string, input: AdminUserWrite): Promise<AdminUserDTO> {
    return api.put(`/api/admin/users/${encodeURIComponent(id)}`, input);
  },

  delete(id: string): Promise<{ ok: true }> {
    return api.del(`/api/admin/users/${encodeURIComponent(id)}`);
  },
};

export const adminStatsService = {
  get(): Promise<AdminStatsDTO> {
    return api.get('/api/admin/stats');
  },
};
