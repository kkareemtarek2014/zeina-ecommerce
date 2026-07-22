'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Trash2 } from 'lucide-react';
import {
  AdminPageHeader,
  EmptyState,
  FilterBar,
  useAdminUsers,
  useDeleteAdminUser,
} from '@/features/admin';
import type { AdminUserDTO } from '@/shared/contracts/admin-ops.contract';
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
import { AppError } from '@/shared/contracts/errors';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { isUserRole, ROLE_LABELS, USER_ROLES } from '@/shared/rbac';

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const me = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [role, setRole] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: q || undefined,
      role: isUserRole(role) ? role : undefined,
    }),
    [page, q, role],
  );

  const { data, isLoading, isError } = useAdminUsers(params);
  const deleteMutation = useDeleteAdminUser();

  const columns: DataTableColumn<AdminUserDTO>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-text-muted">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (row) => (
        <span>{ROLE_LABELS[row.role] ?? row.role}</span>
      ),
    },
    {
      key: 'orders',
      header: 'Orders',
      cell: (row) => row.ordersCount,
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28 text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/admin/users/${row.id}`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
            aria-label={`View ${row.name}`}
          >
            <Eye className="size-4" />
          </Link>
          <button
            type="button"
            aria-label={`Delete ${row.name}`}
            disabled={row.id === me?.id}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-status-error disabled:opacity-40"
            onClick={() => setDeleteId(row.id)}
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
        title="Users"
        subtitle="Manage accounts and roles. Cannot remove yourself or the last admin."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]}
      />


      <FilterBar
        className="mt-6"
        leftSlot={
          <SearchInput
            aria-label="Search users"
            placeholder="Search email, name, phone..."
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
              aria-label="Filter by role"
              className="w-40"
              value={role}
              onChange={(e) => {
                setPage(1);
                setRole(e.target.value);
              }}
            >
              <option value="">All roles</option>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
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
          </>
        }
      />

      <div>
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : isError ? (
          <p className="text-sm text-status-error">Failed to load users.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(r) => r.id}
            emptyContent={
              <EmptyState
                emoji="👤"
                title="No users match your filters"
                description="Try clearing search or role filters."
              />
            }
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
        open={deleteId != null}
        onClose={() => setDeleteId(null)}
        title="Delete user?"
        description="Removes the account and cascaded data. Orders stay with user unlinked."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId, {
            onSuccess: () => {
              toast('User deleted', 'success');
              setDeleteId(null);
            },
            onError: (err) => {
              toast(
                err instanceof AppError ? err.message : 'Could not delete user',
                'error',
              );
              setDeleteId(null);
            },
          });
        }}
      />
    </div>
  );
}
