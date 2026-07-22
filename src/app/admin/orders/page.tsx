'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import {
  AdminPageHeader,
  ORDER_STATUS_LABELS,
  useAdminOrders,
} from '@/features/admin';
import type { AdminOrderDTO, OrderStatus } from '@/shared/contracts/admin-ops.contract';
import {
  ORDER_STATUS_FLOW,
} from '@/shared/contracts/admin-ops.contract';
import {
  Button,
  DataTable,
  type DataTableColumn,
  Pagination,
  SearchInput,
  Select,
} from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { GovernorateDTO } from '@/shared/contracts/product.contract';

const PAGE_SIZE = 20;

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled'];

function parseStatusFilter(value: string): OrderStatus | undefined {
  if (!value) return undefined;
  return ALL_STATUSES.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : undefined;
}

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [status, setStatus] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [preorderOnly, setPreorderOnly] = useState(false);

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: q || undefined,
      status: parseStatusFilter(status),
      governorate: governorate || undefined,
      preorder: preorderOnly || undefined,
    }),
    [page, q, status, governorate, preorderOnly],
  );

  const { data, isLoading, isError } = useAdminOrders(params);
  const { data: governorates = [] } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => api.get<GovernorateDTO[]>('/api/governorates'),
  });

  const columns: DataTableColumn<AdminOrderDTO>[] = [
    {
      key: 'id',
      header: 'Order',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.id}</p>
          <p className="text-xs text-text-muted">
            {new Date(row.createdAt).toLocaleString()}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (row) => (
        <div>
          <p>{row.address.fullName}</p>
          <p className="text-xs text-text-muted">{row.address.phone}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div>
          <p>{ORDER_STATUS_LABELS[row.status]}</p>
          {row.items.some((i) => i.isPreorder) ? (
            <p className="text-xs text-brand-accent">Pre-order</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      cell: (row) => formatEGP(row.total),
    },
    {
      key: 'pay',
      header: 'Payment',
      cell: (row) => (
        <span className="text-xs uppercase tracking-wide text-text-secondary">
          {row.paymentMethod} · {row.paymentStatus}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) => (
        <Link
          href={`/admin/orders/${row.id}`}
          className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
          aria-label={`View ${row.id}`}
        >
          <Eye className="size-4" />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        subtitle="View orders and advance status. Created from checkout only."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Orders' }]}
      />


      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <SearchInput
            aria-label="Search orders"
            placeholder="Search id, phone, name…"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setQ(qDraft.trim());
              }
            }}
          />
        </div>
        <Select
          aria-label="Filter by status"
          className="w-44"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by governorate"
          className="w-44"
          value={governorate}
          onChange={(e) => {
            setPage(1);
            setGovernorate(e.target.value);
          }}
        >
          <option value="">All areas</option>
          {governorates.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 pb-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={preorderOnly}
            onChange={(e) => {
              setPage(1);
              setPreorderOnly(e.target.checked);
            }}
          />
          Pre-orders only
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPage(1);
            setQ(qDraft.trim());
          }}
        >
          Search
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-status-error">Failed to load orders.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(r) => r.id}
            emptyMessage="No orders match your filters."
          />
        )}
      </div>

      {data && data.total > 0 ? (
        <Pagination
          className="mt-4"
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
