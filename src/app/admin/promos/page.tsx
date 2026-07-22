'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AdminPageHeader,
  EmptyState,
  PromoForm,
  type PromoFormSubmit,
  useAdminPromos,
  useCreatePromo,
  useUpdatePromo,
  useTogglePromo,
  useDeletePromo,
} from '@/features/admin';
import type { AdminPromoDTO } from '@/shared/contracts/admin-config.contract';
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

function formatPromoValue(row: AdminPromoDTO): string {
  if (row.type === 'percentage') {
    return `${Math.round(row.value * 100)}%`;
  }
  return formatEGP(row.value);
}

export default function AdminPromosPage() {
  const { toast } = useToast();
  const { data: promos = [], isLoading, isError } = useAdminPromos();
  const createMutation = useCreatePromo();
  const updateMutation = useUpdatePromo();
  const toggleMutation = useTogglePromo();
  const deleteMutation = useDeletePromo();

  const [createOpen, setCreateOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<AdminPromoDTO | null>(null);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);

  const columns: DataTableColumn<AdminPromoDTO>[] = [
    {
      key: 'code',
      header: 'Code',
      cell: (row) => <span className="font-medium">{row.code}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row) => (
        <span className="capitalize">{row.type}</span>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      cell: (row) => formatPromoValue(row),
    },
    {
      key: 'min',
      header: 'Min order',
      cell: (row) =>
        row.minOrderValue != null ? formatEGP(row.minOrderValue) : '-',
    },
    {
      key: 'usage',
      header: 'Usage',
      cell: (row) => (
        <span className="text-xs text-text-muted">
          {row.timesUsed ?? 0} used
          {row.remaining != null ? ` · ${row.remaining} left` : ''}
        </span>
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
              { code: row.code, active: !row.active },
              {
                onSuccess: () =>
                  toast(
                    row.active ? 'Promo deactivated' : 'Promo activated',
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
            aria-label={`Edit ${row.code}`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
            onClick={() => setEditPromo(row)}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${row.code}`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-status-error"
            onClick={() => setDeleteCode(row.code)}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleCreate = async (values: PromoFormSubmit) => {
    if (!values.code) return;
    await createMutation.mutateAsync({
      code: values.code,
      type: values.type,
      value: values.value,
      minOrderValue: values.minOrderValue,
      maxRedemptions: values.maxRedemptions,
      active: values.active,
    });
    toast('Promo created', 'success');
    setCreateOpen(false);
  };

  const handleEdit = async (values: PromoFormSubmit) => {
    if (!editPromo) return;
    await updateMutation.mutateAsync({
      code: editPromo.code,
      input: {
        type: values.type,
        value: values.value,
        minOrderValue: values.minOrderValue,
        maxRedemptions: values.maxRedemptions,
        active: values.active,
      },
    });
    toast('Promo updated', 'success');
    setEditPromo(null);
  };

  return (
    <div>
      <AdminPageHeader
        title="Promos"
        subtitle="Create and manage discount codes for checkout."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Promos' }]}
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add promo
          </Button>
        }
      />


      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : isError ? (
          <p className="text-sm text-status-error">Failed to load promos.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={promos}
            rowKey={(r) => r.code}
            emptyContent={
              <EmptyState
                emoji="🎟️"
                title="No promo codes yet"
                description="Create discount codes for checkout using Add promo above."
              />
            }
          />
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create promo"
      >
        <PromoForm
          mode="create"
          isLoading={createMutation.isPending}
          onSubmit={async (values) => {
            try {
              await handleCreate(values);
            } catch (err) {
              toast(
                err instanceof AppError ? err.message : 'Create failed',
                'error',
              );
            }
          }}
        />
      </Dialog>

      <Dialog
        open={editPromo != null}
        onClose={() => setEditPromo(null)}
        title="Edit promo"
      >
        {editPromo ? (
          <PromoForm
            mode="edit"
            initial={editPromo}
            isLoading={updateMutation.isPending}
            onSubmit={async (values) => {
              try {
                await handleEdit(values);
              } catch (err) {
                toast(
                  err instanceof AppError ? err.message : 'Update failed',
                  'error',
                );
              }
            }}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleteCode != null}
        onClose={() => setDeleteCode(null)}
        title="Delete promo?"
        description="Customers will no longer be able to use this code."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteCode) return;
          deleteMutation.mutate(deleteCode, {
            onSuccess: () => {
              toast('Promo deleted', 'success');
              setDeleteCode(null);
            },
            onError: (err) => {
              toast(
                err instanceof AppError ? err.message : 'Could not delete',
                'error',
              );
              setDeleteCode(null);
            },
          });
        }}
      />
    </div>
  );
}
