'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import {
  AdminPageHeader,
  ORDER_STATUS_LABELS,
  useAdminShipments,
} from '@/features/admin';
import type { ShipmentDTO } from '@/shared/contracts/shipment.contract';
import {
  DataTable,
  type DataTableColumn,
  Pagination,
  SearchInput,
} from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';

const PAGE_SIZE = 20;

export default function AdminShipmentsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: q || undefined,
    }),
    [page, q],
  );

  const { data, isLoading, isError } = useAdminShipments(params);

  const columns: DataTableColumn<ShipmentDTO>[] = [
    {
      key: 'orderId',
      header: 'Order',
      cell: (row) => (
        <Link
          href={`/admin/orders/${encodeURIComponent(row.orderId)}`}
          className="font-medium text-brand-primary hover:underline"
        >
          {row.orderId}
        </Link>
      ),
    },
    {
      key: 'tracking',
      header: 'Tracking',
      cell: (row) =>
        row.trackingNumber ? (
          row.trackingUrl ? (
            <a
              href={row.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-brand-primary hover:underline"
            >
              {row.trackingNumber}
            </a>
          ) : (
            <span className="font-mono text-xs">{row.trackingNumber}</span>
          )
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: 'state',
      header: 'Bosta state',
      cell: (row) => (
        <span className="text-sm text-text-secondary">
          {row.bostaState ?? '—'}
        </span>
      ),
    },
    {
      key: 'mapped',
      header: 'Order status',
      cell: (row) =>
        row.mappedStatus
          ? ORDER_STATUS_LABELS[row.mappedStatus]
          : '—',
    },
    {
      key: 'cod',
      header: 'COD',
      cell: (row) => formatEGP(row.codAmount),
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (row) => (
        <span className="text-xs text-text-muted">
          {new Date(row.updatedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) => (
        <Link
          href={`/admin/orders/${encodeURIComponent(row.orderId)}`}
          aria-label={`View order ${row.orderId}`}
          className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
        >
          <Eye className="size-4" />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Shipments"
        subtitle="Bosta deliveries linked to orders. Enable flag `bosta_shipping` and set secrets to create new shipments."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Shipments' },
        ]}
      />


      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <SearchInput
            aria-label="Search shipments"
            placeholder="Search order or tracking…"
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
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-status-error">Failed to load shipments.</p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(r) => r.id}
              emptyMessage="No shipments yet."
            />
            {data && data.total > PAGE_SIZE ? (
              <div className="mt-4">
                <Pagination
                  page={data.page}
                  pageSize={data.pageSize}
                  total={data.total}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
