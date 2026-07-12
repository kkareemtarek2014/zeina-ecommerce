'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import {
  AdminBreadcrumbs,
  useAdminProducts,
  useAdminCategories,
  useDeleteAdminProduct,
  useRestoreAdminProduct,
} from '@/features/admin';
import type { AdminProductDTO } from '@/shared/contracts/admin-catalog.contract';
import {
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  Pagination,
  SearchInput,
  Select,
  useToast,
} from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';
import { AppError } from '@/shared/contracts/errors';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<AdminProductDTO['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  hidden: 'Hidden',
  archived: 'Archived',
};

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminProductDTO | null>(
    null,
  );

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: q || undefined,
      category: category || undefined,
      status: status || undefined,
      sort: 'newest',
    }),
    [page, q, category, status],
  );

  const { data, isLoading, isError } = useAdminProducts(params);
  const { data: categories = [] } = useAdminCategories();
  const deleteMutation = useDeleteAdminProduct();
  const restoreMutation = useRestoreAdminProduct();

  const columns: DataTableColumn<AdminProductDTO>[] = [
    {
      key: 'name',
      header: 'Product',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush/40">
            {row.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.images[0]}
                alt=""
                className="size-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.name}</p>
            <p className="text-xs text-text-muted">{row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => row.category,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span
          className={
            row.status === 'published'
              ? 'text-status-success'
              : row.status === 'archived'
                ? 'text-text-muted'
                : row.status === 'hidden'
                  ? 'text-status-warning'
                  : ''
          }
        >
          {STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: 'base',
      header: 'Cost',
      cell: (row) => formatEGP(row.basePrice),
    },
    {
      key: 'price',
      header: 'Sell',
      cell: (row) => formatEGP(row.price),
    },
    {
      key: 'stock',
      header: 'Stock',
      cell: (row) => (
        <span className={row.inStock ? '' : 'text-status-error'}>
          {row.availableQty ?? row.stockQty}
          {row.reservedQty ? ` (${row.reservedQty} res.)` : ''}
          {!row.inStock ? ' · OOS' : ''}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32 text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/admin/products/${row.id}/edit`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
            aria-label={`Edit ${row.name}`}
          >
            <Pencil className="size-4" />
          </Link>
          {row.status === 'archived' ? (
            <button
              type="button"
              aria-label={`Restore ${row.name}`}
              className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
              disabled={restoreMutation.isPending}
              onClick={() => {
                restoreMutation.mutate(row.id, {
                  onSuccess: () => toast('Product restored as draft', 'success'),
                  onError: (err) => {
                    toast(
                      err instanceof AppError
                        ? err.message
                        : 'Could not restore product',
                      'error',
                    );
                  },
                });
              }}
            >
              <RotateCcw className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label={
              row.status === 'archived'
                ? `Permanently delete ${row.name}`
                : `Archive ${row.name}`
            }
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-status-error"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const isHardDelete = deleteTarget?.status === 'archived';

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Products' },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
            Products
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage catalog, status, SEO, and images.
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button type="button">
            <Plus className="size-4" />
            Add product
          </Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <SearchInput
            aria-label="Search products"
            placeholder="Search by name…"
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
          aria-label="Filter by category"
          className="w-44"
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by status"
          className="w-40"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">Active (excl. archived)</option>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
          <option value="archived">Archived</option>
        </Select>
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
          <p className="text-sm text-status-error">Failed to load products.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(r) => r.id}
            emptyMessage="No products match your filters."
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

      <ConfirmDialog
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title={isHardDelete ? 'Permanently delete?' : 'Archive product?'}
        description={
          isHardDelete
            ? 'This permanently removes the product and its images. Blocked if it appears on any order.'
            : 'The product will be archived and hidden from the storefront. You can restore it later as a draft.'
        }
        confirmLabel={isHardDelete ? 'Delete forever' : 'Archive'}
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast(
                isHardDelete ? 'Product deleted' : 'Product archived',
                'success',
              );
              setDeleteTarget(null);
            },
            onError: (err) => {
              const msg =
                err instanceof AppError
                  ? err.message
                  : isHardDelete
                    ? 'Could not delete product'
                    : 'Could not archive product';
              toast(msg, 'error');
              setDeleteTarget(null);
            },
          });
        }}
      />
    </div>
  );
}
