'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityFeed,
  AdminBreadcrumbs,
  adminOpsService,
} from '@/features/admin';
import {
  DataTable,
  type DataTableColumn,
  Pagination,
  Select,
} from '@/shared/components/ui';
import type { AdminAuditLogDTO } from '@/shared/contracts/admin-ops-activity.contract';

const PAGE_SIZE = 20;

const ENTITY_OPTIONS = [
  '',
  'product',
  'category',
  'order',
  'user',
  'promo',
  'governorate',
  'shipping_zone',
  'settings',
  'inventory',
  'media',
] as const;

export default function AdminActivityPage() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      entity: entity || undefined,
    }),
    [page, entity],
  );

  const activityQuery = useQuery({
    queryKey: ['admin', 'activity', 30],
    queryFn: () => adminOpsService.listActivity(30),
  });

  const auditQuery = useQuery({
    queryKey: ['admin', 'audit-log', params],
    queryFn: () => adminOpsService.listAuditLog(params),
  });

  const columns: DataTableColumn<AdminAuditLogDTO>[] = [
    {
      key: 'when',
      header: 'When',
      cell: (row) => (
        <time className="text-xs text-text-muted whitespace-nowrap">
          {new Date(row.createdAt).toLocaleString()}
        </time>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      cell: (row) => row.actorName ?? row.actorId,
    },
    {
      key: 'action',
      header: 'Action',
      cell: (row) => (
        <span className="capitalize">{row.action.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      cell: (row) => (
        <span>
          {row.entity}{' '}
          <span className="text-xs text-text-muted">{row.entityId}</span>
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Activity' },
        ]}
      />
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        Activity
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Recent admin actions and full audit log.
      </p>

      <section className="mt-8 rounded-lg border border-border bg-surface-raised p-5">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Recent feed
        </h2>
        <div className="mt-4">
          {activityQuery.isLoading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : activityQuery.isError ? (
            <p className="text-sm text-status-error">Failed to load activity.</p>
          ) : (
            <ActivityFeed items={activityQuery.data ?? []} />
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Audit log
          </h2>
          <Select
            aria-label="Filter by entity"
            className="w-44"
            value={entity}
            onChange={(e) => {
              setPage(1);
              setEntity(e.target.value);
            }}
          >
            <option value="">All entities</option>
            {ENTITY_OPTIONS.filter(Boolean).map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4">
          {auditQuery.isLoading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : auditQuery.isError ? (
            <p className="text-sm text-status-error">Failed to load audit log.</p>
          ) : (
            <DataTable
              columns={columns}
              rows={auditQuery.data?.items ?? []}
              rowKey={(r) => r.id}
              emptyMessage="No audit entries match."
            />
          )}
        </div>

        {auditQuery.data && auditQuery.data.total > 0 ? (
          <Pagination
            className="mt-4"
            page={auditQuery.data.page}
            pageSize={auditQuery.data.pageSize}
            total={auditQuery.data.total}
            onPageChange={setPage}
          />
        ) : null}
      </section>
    </div>
  );
}
