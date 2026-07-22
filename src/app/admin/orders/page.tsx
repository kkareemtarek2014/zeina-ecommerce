'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, CheckSquare, Square } from 'lucide-react';
import {
  AdminPageHeader,
  ORDER_STATUS_LABELS,
  OrderDrawer,
  OrderQuickActions,
  StatusPill,
  useAdminOrders,
  useAdminStats,
  useBulkUpdateAdminOrderStatus,
} from '@/features/admin';
import type { AdminOrderDTO, OrderStatus } from '@/shared/contracts/admin-ops.contract';
import { ORDER_STATUS_FLOW } from '@/shared/contracts/admin-ops.contract';
import {
  Button,
  DataTable,
  type DataTableColumn,
  Pagination,
  SearchInput,
  Select,
  useToast,
} from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { GovernorateDTO } from '@/shared/contracts/product.contract';

const PAGE_SIZE = 20;
const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled'];

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [preorderOnly, setPreorderOnly] = useState(false);
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const currentStatusParam = searchParams.get('status') ?? '';

  const setStatusFilter = (newStatus: string) => {
    setPage(1);
    setSelectedIds(new Set());
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    router.replace(`/admin/orders?${params.toString()}`);
  };

  const statusFilter = useMemo((): OrderStatus | undefined => {
    if (!currentStatusParam) return undefined;
    if (ALL_STATUSES.includes(currentStatusParam as OrderStatus)) {
      return currentStatusParam as OrderStatus;
    }
    return undefined;
  }, [currentStatusParam]);

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: q || undefined,
      status: statusFilter,
      governorate: governorate || undefined,
      preorder: preorderOnly || undefined,
    }),
    [page, q, statusFilter, governorate, preorderOnly],
  );

  const { data, isLoading, isError } = useAdminOrders(params);
  const { data: stats } = useAdminStats();
  const bulkStatusMutation = useBulkUpdateAdminOrderStatus();

  const { data: governorates = [] } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => api.get<GovernorateDTO[]>('/api/governorates'),
  });

  const ordersList = data?.items ?? [];

  // Toggle single selection
  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Toggle select all on current page
  const toggleSelectAll = () => {
    if (selectedIds.size === ordersList.length && ordersList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ordersList.map((r) => r.id)));
    }
  };

  const handleBulkAdvance = async (targetStatus: OrderStatus) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      const res = await bulkStatusMutation.mutateAsync({
        ids,
        status: targetStatus,
      });
      if (res.succeeded.length > 0) {
        toast(
          `Successfully updated ${res.succeeded.length} order(s) to ${ORDER_STATUS_LABELS[targetStatus]}`,
          'success',
        );
      }
      if (res.failed.length > 0) {
        toast(`Failed to update ${res.failed.length} order(s)`, 'error');
      }
      setSelectedIds(new Set());
    } catch {
      toast('Bulk status update failed', 'error');
    }
  };

  const columns: DataTableColumn<AdminOrderDTO>[] = [
    {
      key: 'select',
      header: (
        <button
          type="button"
          onClick={toggleSelectAll}
          className="text-text-muted hover:text-text-primary"
          aria-label="Select all orders"
        >
          {selectedIds.size > 0 && selectedIds.size === ordersList.length ? (
            <CheckSquare className="size-4 text-brand-primary" />
          ) : (
            <Square className="size-4" />
          )}
        </button>
      ),
      className: 'w-10 text-center',

      cell: (row) => (
        <button
          type="button"
          onClick={(e) => toggleSelectRow(row.id, e)}
          className="text-text-muted hover:text-text-primary"
          aria-label={`Select order ${row.id}`}
        >
          {selectedIds.has(row.id) ? (
            <CheckSquare className="size-4 text-brand-primary" />
          ) : (
            <Square className="size-4" />
          )}
        </button>
      ),
    },
    {
      key: 'id',
      header: 'Order',
      cell: (row) => (
        <div
          onClick={() => setDrawerOrderId(row.id)}
          className="cursor-pointer group"
        >
          <p className="font-medium group-hover:text-brand-primary group-hover:underline">
            #{row.id}
          </p>
          <p className="text-xs text-text-muted">
            {new Date(row.createdAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (row) => (
        <div
          onClick={() => setDrawerOrderId(row.id)}
          className="cursor-pointer"
        >
          <p className="font-medium text-text-primary">{row.address.fullName}</p>
          <p className="text-xs text-text-muted">{row.address.phone}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill status={row.status} />
          {row.items.some((i) => i.isPreorder) ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-accent">
              Pre-order
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      cell: (row) => (
        <div>
          <p className="font-semibold text-text-primary">{formatEGP(row.total)}</p>
          <p className="text-[11px] uppercase text-text-muted">
            {row.paymentMethod} &middot; {row.paymentStatus}
          </p>
        </div>
      ),
    },
    {
      key: 'quick_action',
      header: 'Advance',
      className: 'w-32',
      cell: (row) => (
        <OrderQuickActions orderId={row.id} status={row.status} size="sm" />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setDrawerOrderId(row.id)}
            className="inline-flex size-8 items-center justify-center rounded-(--radius) text-text-secondary transition-colors hover:bg-surface-raised hover:text-brand-primary"
            aria-label={`Inspect order ${row.id}`}
          >
            <Eye className="size-4" />
          </button>
          <Link
            href={`/admin/orders/${row.id}`}
            className="inline-flex size-8 items-center justify-center rounded-(--radius) text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary text-xs"
            aria-label={`View detail ${row.id}`}
          >
            &rarr;
          </Link>
        </div>
      ),
    },
  ];

  const statusCounts: Record<string, number> = stats?.ordersByStatus ?? {};

  const totalNeedsAction =
    (statusCounts.placed ?? 0) + (statusCounts.confirmed ?? 0);


  return (
    <div>
      <AdminPageHeader
        title="Orders"
        subtitle="Manage customer orders, inspect shipping details, and process status workflow."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Orders' }]}
      />

      {/* Status Filter Tabs */}
      <div className="mt-6 flex overflow-x-auto border-b border-border pb-px no-scrollbar">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              !currentStatusParam
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
            }`}
          >
            <span>All orders</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('placed')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              currentStatusParam === 'placed' || currentStatusParam === 'needs_action'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
            }`}
          >
            <span>Needs Action</span>
            {totalNeedsAction > 0 && (
              <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-[10px] font-bold text-brand-accent">
                {totalNeedsAction}
              </span>
            )}
          </button>

          {ALL_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                currentStatusParam === st
                  ? 'border-brand-primary text-brand-primary font-semibold'
                  : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
              }`}
            >
              <span>{ORDER_STATUS_LABELS[st]}</span>
              {statusCounts[st] !== undefined && statusCounts[st] > 0 && (
                <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                  {statusCounts[st]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <SearchInput
            aria-label="Search orders"
            placeholder="Search order id, phone, name…"
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
          aria-label="Filter by governorate"
          className="w-44"
          value={governorate}
          onChange={(e) => {
            setPage(1);
            setGovernorate(e.target.value);
          }}
        >
          <option value="">All governorates</option>
          {governorates.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 pb-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={preorderOnly}
            onChange={(e) => {
              setPage(1);
              setPreorderOnly(e.target.checked);
            }}
            className="rounded border-border text-brand-primary focus:ring-brand-primary"
          />
          Pre-orders only
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setPage(1);
            setQ(qDraft.trim());
          }}
        >
          Search
        </Button>
      </div>

      {/* Bulk Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-3 text-xs">
          <div className="flex items-center gap-2 font-medium text-text-primary">
            <span>{selectedIds.size} order(s) selected</span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-text-muted hover:text-text-primary underline ml-2"
            >
              Clear selection
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-secondary font-medium">Advance to:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={bulkStatusMutation.isPending}
              onClick={() => void handleBulkAdvance('confirmed')}
              className="h-7 text-xs"
            >
              Confirmed
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={bulkStatusMutation.isPending}
              onClick={() => void handleBulkAdvance('shipped')}
              className="h-7 text-xs"
            >
              Shipped
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={bulkStatusMutation.isPending}
              onClick={() => void handleBulkAdvance('delivered')}
              className="h-7 text-xs"
            >
              Delivered
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-5">
        {isLoading ? (
          <p className="text-sm text-text-muted py-8 text-center">Loading orders…</p>
        ) : isError ? (
          <p className="text-sm text-status-error py-8 text-center">
            Failed to load orders.
          </p>
        ) : (
          <DataTable
            columns={columns}
            rows={ordersList}
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

      {/* Order Quick View Drawer */}
      <OrderDrawer
        orderId={drawerOrderId}
        onClose={() => setDrawerOrderId(null)}
      />
    </div>
  );
}
