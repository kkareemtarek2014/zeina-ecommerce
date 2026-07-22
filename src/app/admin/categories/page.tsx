'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AdminPageHeader,
  EmptyState,
  useAdminCategories,
  useDeleteAdminCategory,
} from '@/features/admin';
import type { AdminCategoryDTO } from '@/shared/contracts/admin-catalog.contract';
import {
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  useToast,
} from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const { data: categories = [], isLoading, isError } = useAdminCategories();
  const deleteMutation = useDeleteAdminCategory();
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  const columns: DataTableColumn<AdminCategoryDTO>[] = [
    {
      key: 'name',
      header: 'Category',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.image} alt="" className="size-full object-cover" />
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-text-muted">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'sort',
      header: 'Order',
      cell: (row) => row.sortOrder,
    },
    {
      key: 'seo',
      header: 'SEO',
      cell: (row) => (
        <span className="line-clamp-2 max-w-xs text-text-secondary">
          {row.seoDescription}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28 text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/admin/categories/${row.slug}/edit`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
            aria-label={`Edit ${row.name}`}
          >
            <Pencil className="size-4" />
          </Link>
          <button
            type="button"
            aria-label={`Delete ${row.name}`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-status-error"
            onClick={() => setDeleteSlug(row.slug)}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        subtitle="Shop sections and SEO copy."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Categories' },
        ]}
        action={
          <Link href="/admin/categories/new">
            <Button type="button">
              <Plus className="size-4" />
              Add category
            </Button>
          </Link>
        }
      />


      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : isError ? (
          <p className="text-sm text-status-error">Failed to load categories.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={categories}
            rowKey={(r) => r.slug}
            emptyContent={
              <EmptyState
                emoji="📂"
                title="No categories yet"
                description="Add shop sections and SEO copy for your catalog."
                action={{
                  label: 'Add category',
                  href: '/admin/categories/new',
                }}
              />
            }
          />
        )}
      </div>

      <ConfirmDialog
        open={deleteSlug != null}
        onClose={() => setDeleteSlug(null)}
        title="Delete category?"
        description="Blocked if any products still use this category."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteSlug) return;
          deleteMutation.mutate(deleteSlug, {
            onSuccess: () => {
              toast('Category deleted', 'success');
              setDeleteSlug(null);
            },
            onError: (err) => {
              toast(
                err instanceof AppError
                  ? err.message
                  : 'Could not delete category',
                'error',
              );
              setDeleteSlug(null);
            },
          });
        }}
      />
    </div>
  );
}
