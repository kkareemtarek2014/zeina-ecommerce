import { api } from '@/shared/lib/api-client';
import type {
  AdminOrderDTO,
  AdminOrderStatusPatch,
  AdminOrderBulkStatus,
  AdminUserDetailDTO,
  AdminUserDTO,
  AdminUserWrite,
  OrderStatus,
} from '@/shared/contracts/admin-ops.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';
import type { AdminStatsDTO } from '@/shared/contracts/admin-stats.contract';
import type {
  AdminActivityItem,
  AdminAuditLogDTO,
  AdminNotificationDTO,
} from '@/shared/contracts/admin-ops-activity.contract';
import type { UserRole } from '@/shared/rbac';

export type AdminOrderListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: OrderStatus;
  governorate?: string;
  dateFrom?: string;
  dateTo?: string;
  preorder?: boolean;
};

export type AdminUserListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: UserRole;
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
        preorder: params.preorder ? '1' : undefined,
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

  bulkUpdateStatus(
    input: AdminOrderBulkStatus,
  ): Promise<{ succeeded: string[]; failed: Array<{ id: string; error: string }> }> {
    return api.post('/api/admin/orders/bulk-status', input);
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

export const adminOpsService = {
  listNotifications(params: { unreadOnly?: boolean; limit?: number } = {}) {
    return api.get<{
      items: AdminNotificationDTO[];
      unreadCount: number;
    }>(
      `/api/admin/notifications${toQuery({
        unreadOnly: params.unreadOnly ? 'true' : undefined,
        limit: params.limit,
      })}`,
    );
  },

  markNotificationRead(id: string): Promise<{ ok: true }> {
    return api.patch(
      `/api/admin/notifications/${encodeURIComponent(id)}/read`,
      {},
    );
  },

  markAllNotificationsRead(): Promise<{ ok: true; count: number }> {
    return api.post('/api/admin/notifications/read-all', {});
  },

  listActivity(limit = 20): Promise<AdminActivityItem[]> {
    return api.get(`/api/admin/activity${toQuery({ limit })}`);
  },

  listAuditLog(params: {
    page?: number;
    pageSize?: number;
    entity?: string;
    actorId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<Paginated<AdminAuditLogDTO>> {
    return api.get(
      `/api/admin/audit-log${toQuery({
        page: params.page,
        pageSize: params.pageSize,
        entity: params.entity,
        actorId: params.actorId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      })}`,
    );
  },
};
