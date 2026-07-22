'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  ORDER_STATUS_LABELS,
  UserForm,
  useAdminUser,
  useDeleteAdminUser,
  useUpdateAdminUser,
} from '@/features/admin';
import {
  Button,
  ConfirmDialog,
  useToast,
} from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';
import { AppError } from '@/shared/contracts/errors';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useState } from 'react';

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const me = useAuthStore((s) => s.user);
  const { data: user, isLoading, isError } = useAdminUser(id);
  const updateMutation = useUpdateAdminUser(id);
  const deleteMutation = useDeleteAdminUser();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div>
      <AdminPageHeader
        title={user?.name ?? 'User'}
        subtitle={user?.email}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: user?.name ?? 'User' },
        ]}
        action={
          user && user.id !== me?.id ? (
            <Button
              type="button"
              variant="outline"
              className="border-status-error text-status-error hover:bg-status-error/10"
              onClick={() => setConfirmDelete(true)}
            >
              Delete user
            </Button>
          ) : null
        }
      />


      {isLoading ? (
        <p className="mt-6 text-sm text-text-muted">Loading…</p>
      ) : isError || !user ? (
        <p className="mt-6 text-sm text-status-error">User not found.</p>
      ) : (
        <div className="mt-8 space-y-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
              <p className="text-xs text-text-muted">Orders</p>
              <p className="mt-1 text-xl font-semibold">
                {user.stats.ordersCount}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
              <p className="text-xs text-text-muted">Total spent</p>
              <p className="mt-1 text-xl font-semibold">
                {formatEGP(user.stats.totalSpent)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
              <p className="text-xs text-text-muted">Last order</p>
              <p className="mt-1 text-sm font-medium">
                {user.stats.lastOrderAt
                  ? new Date(user.stats.lastOrderAt).toLocaleString()
                  : '—'}
              </p>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <section>
              <h2 className="mb-4 font-medium text-text-primary">Profile</h2>
              <UserForm
                key={user.id}
                initial={user}
                lockRole={user.id === me?.id}
                isLoading={updateMutation.isPending}
                onSubmit={async (values) => {
                  try {
                    await updateMutation.mutateAsync({
                      name: values.name,
                      phone: values.phone,
                      ...(user.id === me?.id ? {} : { role: values.role }),
                    });
                    toast('User saved', 'success');
                  } catch (err) {
                    toast(
                      err instanceof AppError ? err.message : 'Save failed',
                      'error',
                    );
                  }
                }}
              />
            </section>

            <section>
              <h2 className="mb-4 font-medium text-text-primary">
                Recent orders ({user.stats.ordersCount})
              </h2>
              {user.recentOrders.length === 0 ? (
                <p className="text-sm text-text-muted">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {user.recentOrders.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-brand-blush/20"
                      >
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-xs text-text-muted">
                            {ORDER_STATUS_LABELS[order.status]} ·{' '}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatEGP(order.total)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <section>
              <h2 className="mb-4 font-medium text-text-primary">
                Favorites ({user.favorites.length})
              </h2>
              {user.favorites.length === 0 ? (
                <p className="text-sm text-text-muted">No favorites.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {user.favorites.map((fav) => (
                    <li key={fav.id}>
                      <Link
                        href={`/admin/products/${fav.id}/edit`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-brand-blush/20"
                      >
                        <div className="size-10 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush/40">
                          {fav.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={fav.image}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : null}
                        </div>
                        <p className="truncate font-medium">{fav.name}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-4 font-medium text-text-primary">
                Addresses ({user.addresses.length})
              </h2>
              {user.addresses.length === 0 ? (
                <p className="text-sm text-text-muted">No saved addresses.</p>
              ) : (
                <ul className="space-y-3">
                  {user.addresses.map((addr) => (
                    <li
                      key={addr.id}
                      className="rounded-lg border border-border px-4 py-3 text-sm"
                    >
                      <p className="font-medium">{addr.label}</p>
                      <p className="mt-1 text-text-secondary">
                        {addr.street}, {addr.city}
                      </p>
                      <p className="text-xs text-text-muted">
                        {addr.governorate}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete user?"
        description="This permanently removes the account. Orders remain with user unlinked."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(id, {
            onSuccess: () => {
              toast('User deleted', 'success');
              router.push('/admin/users');
            },
            onError: (err) => {
              toast(
                err instanceof AppError ? err.message : 'Could not delete user',
                'error',
              );
              setConfirmDelete(false);
            },
          });
        }}
      />
    </div>
  );
}
