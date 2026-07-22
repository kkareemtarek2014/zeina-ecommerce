'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Copy,
  Download,
  Upload,
} from 'lucide-react';
import {
  AdminPageHeader,
  EmptyState,
  FilterBar,
  StatusPill,
  adminCatalogService,
  useAdminProducts,
  useAdminCategories,
  useAdminSettings,
  useDeleteAdminProduct,
  useRestoreAdminProduct,
  useDuplicateAdminProduct,
  useBulkAdminProducts,
} from '@/features/admin';
import type {
  AdminProductBulk,
  AdminProductDTO,
} from '@/shared/contracts/admin-catalog.contract';
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

type BulkAction = AdminProductBulk['action'];

export default function AdminProductsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const importRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<AdminProductDTO | null>(
    null,
  );
  const [bulkConfirm, setBulkConfirm] = useState<{
    action: BulkAction;
    categorySlug?: string;
  } | null>(null);
  const [bulkCategorySlug, setBulkCategorySlug] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const lowStockOnly = searchParams.get('lowStock') === '1';

  const setLowStockOnly = (next: boolean) => {
    setPage(1);
    setSelected(new Set());
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('lowStock', '1');
    else params.delete('lowStock');
    const qs = params.toString();
    router.replace(qs ? `/admin/products?${qs}` : '/admin/products');
  };

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: q || undefined,
      category: category || undefined,
      status: status || undefined,
      sort: 'newest',
      lowStock: lowStockOnly || undefined,
    }),
    [page, q, category, status, lowStockOnly],
  );

  const { data, isLoading, isError } = useAdminProducts(params);
  const { data: settings } = useAdminSettings();
  const { data: categories = [] } = useAdminCategories();
  const deleteMutation = useDeleteAdminProduct();
  const restoreMutation = useRestoreAdminProduct();
  const duplicateMutation = useDuplicateAdminProduct();
  const bulkMutation = useBulkAdminProducts();

  const threshold = settings?.lowStockThreshold ?? 5;
  const rows = data?.items ?? [];

  const allSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await adminCatalogService.exportProductsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sqoosh-products.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast('CSV exported', 'success');
    } catch (err) {
      toast(
        err instanceof AppError ? err.message : 'Export failed',
        'error',
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(file: File) {
    setImporting(true);
    try {
      const report = await adminCatalogService.importProductsCsv(file);
      const errN = report.errors.length;
      toast(
        `Import: ${report.created} created, ${report.updated} updated` +
          (errN ? `, ${errN} row error(s)` : ''),
        errN && report.created + report.updated === 0 ? 'error' : 'success',
      );
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      setPage(1);
    } catch (err) {
      toast(
        err instanceof AppError ? err.message : 'Import failed',
        'error',
      );
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  }

  const columns: DataTableColumn<AdminProductDTO>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-10',
      cell: (row) => (
        <input
          type="checkbox"
          aria-label={`Select ${row.name}`}
          checked={selected.has(row.id)}
          onChange={() => toggleOne(row.id)}
          className="size-4 rounded border-border"
        />
      ),
    },
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
            <p className="text-xs text-text-muted">
              {row.sku ? `${row.sku} · ` : ''}
              {row.id}
            </p>
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
      cell: (row) => <StatusPill status={row.status} size="sm" />,
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
      cell: (row) => {
        const qty = row.availableQty ?? row.stockQty;
        const low = qty <= threshold;
        return (
          <span
            className={
              !row.inStock || qty <= 0
                ? 'font-semibold text-status-error'
                : low
                  ? 'font-semibold text-status-warning'
                  : ''
            }
          >
            {qty}
            {row.reservedQty ? ` (${row.reservedQty} res.)` : ''}
            {!row.inStock ? ' · OOS' : ''}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40 text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/admin/products/${row.id}/edit`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
            aria-label={`Edit ${row.name}`}
          >
            <Pencil className="size-4" />
          </Link>
          <button
            type="button"
            aria-label={`Duplicate ${row.name}`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
            disabled={duplicateMutation.isPending}
            onClick={() => {
              duplicateMutation.mutate(row.id, {
                onSuccess: (created) => {
                  toast('Draft duplicate created', 'success');
                  router.push(`/admin/products/${created.id}/edit`);
                },
                onError: (err) => {
                  toast(
                    err instanceof AppError
                      ? err.message
                      : 'Could not duplicate',
                    'error',
                  );
                },
              });
            }}
          >
            <Copy className="size-4" />
          </button>
          {row.status === 'archived' ? (
            <button
              type="button"
              aria-label={`Restore ${row.name}`}
              className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
              disabled={restoreMutation.isPending}
              onClick={() => {
                restoreMutation.mutate(row.id, {
                  onSuccess: () =>
                    toast('Product restored as draft', 'success'),
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

  const bulkLabel =
    bulkConfirm?.action === 'archive'
      ? 'Archive selected'
      : bulkConfirm?.action === 'publish'
        ? 'Publish selected'
        : bulkConfirm?.action === 'hide'
          ? 'Hide selected'
          : 'Move category';

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle="Manage catalog, status, SEO, and images."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Products' },
        ]}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              isLoading={exporting}
              onClick={() => void handleExport()}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              isLoading={importing}
              onClick={() => importRef.current?.click()}
            >
              <Upload className="size-4" />
              Import CSV
            </Button>
            <input
              ref={importRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
              }}
            />
            <Link href="/admin/import">
              <Button type="button" variant="outline">
                <Download className="size-4" />
                Temu import
              </Button>
            </Link>
            <Link href="/admin/products/new">
              <Button type="button">
                <Plus className="size-4" />
                Add product
              </Button>
            </Link>
          </div>
        }
      />

      <FilterBar
        className="mt-6"
        leftSlot={
          <SearchInput
            aria-label="Search products"
            placeholder="Search name, SKU, tags, description..."
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setQ(qDraft.trim());
              }
            }}
          />
        }
        rightSlot={
          <>
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
            <label className="inline-flex items-center gap-2 rounded-(--radius) border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary">
              <input
                type="checkbox"
                className="size-4 accent-brand-primary"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              Low stock
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
          </>
        }
      />

      {selected.size > 0 ? (
        <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-brand-blush/30 px-3 py-3">
          <p className="mr-2 text-sm text-text-secondary">
            {selected.size} selected
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setBulkConfirm({ action: 'publish' })}
          >
            Publish
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setBulkConfirm({ action: 'hide' })}
          >
            Hide
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setBulkConfirm({ action: 'archive' })}
          >
            Archive
          </Button>
          <Select
            aria-label="Bulk set category"
            className="w-44"
            value={bulkCategorySlug}
            onChange={(e) => setBulkCategorySlug(e.target.value)}
          >
            <option value="">Set category...</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!bulkCategorySlug}
            onClick={() =>
              setBulkConfirm({
                action: 'set-category',
                categorySlug: bulkCategorySlug,
              })
            }
          >
            Apply category
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      ) : null}

      <div>
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : isError ? (
          <p className="text-sm text-status-error">Failed to load products.</p>
        ) : (
          <>
            {rows.length > 0 ? (
              <div className="mb-2 flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  aria-label="Select all on page"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 rounded border-border"
                />
                Select all on page
                {lowStockOnly ? (
                  <span className="text-xs text-text-muted">
                    · low stock (threshold {threshold})
                    {data ? ` · ${data.total} total` : ''}
                  </span>
                ) : null}
              </div>
            ) : null}
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(r) => r.id}
              emptyContent={
                <EmptyState
                  emoji={lowStockOnly ? '📦' : '🧸'}
                  title={
                    lowStockOnly
                      ? 'Stock looks healthy'
                      : 'No products match your filters'
                  }
                  description={
                    lowStockOnly
                      ? `Nothing is at or below the low-stock threshold (${threshold}).`
                      : 'Try clearing filters or add a new product.'
                  }
                  action={
                    lowStockOnly
                      ? {
                          label: 'Show all products',
                          href: '/admin/products',
                        }
                      : {
                          label: 'Add product',
                          href: '/admin/products/new',
                        }
                  }
                />
              }
            />
          </>
        )}
      </div>

      {data && data.total > 0 ? (
        <Pagination
          className="mt-4"
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={(p) => {
            setSelected(new Set());
            setPage(p);
          }}
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

      <ConfirmDialog
        open={bulkConfirm != null}
        onClose={() => setBulkConfirm(null)}
        title={bulkLabel}
        description={`Apply "${bulkConfirm?.action ?? ''}" to ${selected.size} product(s)?`}
        confirmLabel="Confirm"
        danger={bulkConfirm?.action === 'archive'}
        isLoading={bulkMutation.isPending}
        onConfirm={() => {
          if (!bulkConfirm) return;
          bulkMutation.mutate(
            {
              ids: [...selected],
              action: bulkConfirm.action,
              payload:
                bulkConfirm.action === 'set-category'
                  ? { categorySlug: bulkConfirm.categorySlug }
                  : undefined,
            },
            {
              onSuccess: (res) => {
                const failed = res.results.filter((r) => !r.ok).length;
                toast(
                  failed
                    ? `Bulk done with ${failed} failure(s)`
                    : 'Bulk update complete',
                  failed ? 'error' : 'success',
                );
                setSelected(new Set());
                setBulkConfirm(null);
              },
              onError: (err) => {
                toast(
                  err instanceof AppError ? err.message : 'Bulk failed',
                  'error',
                );
                setBulkConfirm(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
