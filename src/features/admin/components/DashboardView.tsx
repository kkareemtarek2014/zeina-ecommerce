'use client';

import Link from 'next/link';
import { AdminBreadcrumbs } from './AdminShell';
import { LatestProducts } from './LatestProducts';
import { ORDER_STATUS_LABELS } from './OrderStatusSelect';
import { RecentOrders } from './RecentOrders';
import { SalesChart } from './SalesChart';
import { StatCard } from './StatCard';
import { useAdminStats } from '../hooks/useAdminOps';
import {
  ORDER_STATUS_FLOW,
  type OrderStatus,
} from '@/shared/contracts/admin-ops.contract';
import { formatEGP } from '@/shared/utils/price';

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled'];

export function DashboardView() {
  const { data, isLoading, isError } = useAdminStats();

  return (
    <div>
      <AdminBreadcrumbs
        items={[{ label: 'Admin', href: '/admin' }, { label: 'Dashboard' }]}
      />
      <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Store overview — revenue, orders, and recent activity.
      </p>

      {isLoading ? (
        <p className="mt-8 text-sm text-text-muted">Loading dashboard…</p>
      ) : isError || !data ? (
        <p className="mt-8 text-sm text-status-error">
          Failed to load dashboard stats.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Revenue"
              value={formatEGP(data.revenueTotal)}
              hint="Delivered orders"
            />
            <StatCard
              title="Orders"
              value={data.ordersCount.toLocaleString()}
            />
            <StatCard
              title="Products"
              value={data.productsCount.toLocaleString()}
            />
            <StatCard
              title="Users"
              value={data.usersCount.toLocaleString()}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((status) => {
              const count = data.ordersByStatus[status] ?? 0;
              if (count === 0) return null;
              return (
                <Link
                  key={status}
                  href={`/admin/orders?status=${status}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-primary"
                >
                  <span>{ORDER_STATUS_LABELS[status]}</span>
                  <span className="font-medium text-brand-primary">{count}</span>
                </Link>
              );
            })}
          </div>

          <section className="rounded-(--radius-lg) border border-border bg-surface-raised p-5">
            <h2 className="font-(family-name:--font-display) text-lg font-semibold text-text-primary">
              Sales (14 days)
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Daily revenue from delivered orders
            </p>
            <div className="mt-4">
              <SalesChart data={data.salesByDay} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-(--radius-lg) border border-border bg-surface-raised p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-(family-name:--font-display) text-lg font-semibold text-text-primary">
                  Recent orders
                </h2>
                <Link
                  href="/admin/orders"
                  className="text-xs font-medium text-brand-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="mt-4">
                <RecentOrders orders={data.recentOrders} />
              </div>
            </section>

            <section className="rounded-(--radius-lg) border border-border bg-surface-raised p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-(family-name:--font-display) text-lg font-semibold text-text-primary">
                  Latest products
                </h2>
                <Link
                  href="/admin/products"
                  className="text-xs font-medium text-brand-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="mt-4">
                <LatestProducts products={data.latestProducts} />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
