'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AdminPageHeader,
  EmptyState,
  BundleForm,
  type BundleFormSubmit,
  useAdminBundles,
  useCreateBundle,
  useUpdateBundle,
  useToggleBundle,
  useDeleteBundle,
} from '@/features/admin';
import type { AdminBundleDTO } from '@/shared/contracts/admin-bundles.contract';
import {
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  Dialog,
  useToast,
} from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';
import { AppError } from '@/shared/contracts/errors';

function formatConfig(row: AdminBundleDTO): string {
  if (row.type === 'bxgy') {
    return `Buy ${String(row.config.buyQty)} get ${String(row.config.getQty)}`;
  }
  return formatEGP(Number(row.config.price) || 0);
}

export default function AdminBundlesPage() {
  const { toast } = useToast();
  const { data: bundles = [], isLoading, isError } = useAdminBundles();
  const createMutation = useCreateBundle();
  const updateMutation = useUpdateBundle();
  const toggleMutation = useToggleBundle();
  const deleteMutation = useDeleteBundle();

  const [createOpen, setCreateOpen] = useState(false);
  const [editBundle, setEditBundle] = useState<AdminBundleDTO | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: DataTableColumn<AdminBundleDTO>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row) => <span className="capitalize">{row.type.replace('_', ' ')}</span>,
    },
    {
      key: 'config',
      header: 'Offer',
      cell: (row) => formatConfig(row),
    },
    {
      key: 'items',
      header: 'Products',
      cell: (row) => (
        <span className="text-xs text-text-muted">{row.items.length}</span>
      ),
    },
    {
      key: 'active',
      header: 'Active',
      cell: (row) => (
        <Button
          type="button"
          size="sm"
          variant={row.active ? 'outline' : 'ghost'}
          disabled={toggleMutation.isPending}
          onClick={() => {
            toggleMutation.mutate(
              { id: row.id, active: !row.active },
              {
                onSuccess: () =>
                  toast(
                    row.active ? 'Bundle deactivated' : 'Bundle activated',
                    'success',
                  ),
                onError: (err) =>
                  toast(
                    err instanceof AppError ? err.message : 'Toggle failed',
                    'error',
                  ),
              },
            );
          }}
        >
          {row.active ? 'Active' : 'Inactive'}
        </Button>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28 text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${row.name}`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
            onClick={() => setEditBundle(row)}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${row.name}`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-status-error"
            onClick={() => setDeleteId(row.id)}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleCreate = async (values: BundleFormSubmit) => {
    try {
      await createMutation.mutateAsync(values);
      toast('Bundle created', 'success');
      setCreateOpen(false);
    } catch (err) {
      toast(err instanceof AppError ? err.message : 'Create failed', 'error');
    }
  };

  const handleUpdate = async (values: BundleFormSubmit) => {
    if (!editBundle) return;
    try {
      await updateMutation.mutateAsync({ id: editBundle.id, input: values });
      toast('Bundle updated', 'success');
      setEditBundle(null);
    } catch (err) {
      toast(err instanceof AppError ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Bundles"
        subtitle="Buy-X-Get-Y and fixed-price sets. Discount applies server-side at checkout when the bundles flag is on."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Bundles' }]}
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New bundle
          </Button>
        }
      />


      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : isError ? (
          <p className="text-sm text-status-error">Failed to load bundles.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={bundles}
            rowKey={(r) => r.id}
            emptyContent={
              <EmptyState
                emoji="🎁"
                title="No bundles yet"
                description="Create buy-X-get-Y or fixed-price sets using New bundle above."
              />
            }
          />
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create bundle"
      >
        <BundleForm
          isLoading={createMutation.isPending}
          onSubmit={handleCreate}
        />
      </Dialog>

      <Dialog
        open={Boolean(editBundle)}
        onClose={() => setEditBundle(null)}
        title="Edit bundle"
      >
        {editBundle ? (
          <BundleForm
            key={editBundle.id}
            initial={editBundle}
            isLoading={updateMutation.isPending}
            onSubmit={handleUpdate}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete bundle?"
        description="This cannot be undone."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId, {
            onSuccess: () => {
              toast('Bundle deleted', 'success');
              setDeleteId(null);
            },
            onError: (err) =>
              toast(
                err instanceof AppError ? err.message : 'Delete failed',
                'error',
              ),
          });
        }}
      />
    </div>
  );
}
