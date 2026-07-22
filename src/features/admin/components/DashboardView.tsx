'use client';

import Link from 'next/link';
import { ActivityFeed } from './ActivityFeed';
import { AdminPageHeader } from './ui';
import { LatestProducts } from './LatestProducts';
import { ORDER_STATUS_LABELS } from './OrderStatusSelect';
import { RecentOrders } from './RecentOrders';
import { SalesChart } from './SalesChart';
import { StatCard } from './StatCard';
import { TemuScraperToggle } from './TemuScraperToggle';
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
      <AdminPageHeader
        title="Dashboard"
        subtitle="Store overview — revenue, orders, and recent activity."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Dashboard' }]}
      />


      <div className="mt-6">
        <TemuScraperToggle />
      </div>

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
              hint="All non-cancelled orders"
            />
            <StatCard
              title="Today"
              value={formatEGP(data.revenueToday)}
              hint="UTC day"
            />
            <StatCard
              title="This month"
              value={formatEGP(data.revenueThisMonth)}
              hint="UTC month"
            />
            <StatCard
              title="Avg order"
              value={formatEGP(data.avgOrderValue)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <StatCard
              title="New customers"
              value={data.newCustomers.toLocaleString()}
              hint="Last 30 days"
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

          <section className="rounded-lg border border-border bg-surface-raised p-5">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Sales (14 days)
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Daily revenue from delivered orders
            </p>
            <div className="mt-4">
              <SalesChart data={data.salesByDay} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-lg border border-border bg-surface-raised p-5">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Best sellers
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {data.bestSellers.length === 0 ? (
                  <li className="py-2 text-sm text-text-muted">No sales yet.</li>
                ) : (
                  data.bestSellers.map((row) => (
                    <li
                      key={row.productId}
                      className="flex items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <Link
                        href={`/admin/products/${row.productId}/edit`}
                        className="min-w-0 truncate font-medium hover:text-brand-primary"
                      >
                        {row.name}
                      </Link>
                      <span className="shrink-0 text-text-muted">
                        {row.qty} · {formatEGP(row.revenue)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>
            <section className="rounded-lg border border-border bg-surface-raised p-5">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Most viewed
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {data.mostViewed.length === 0 ? (
                  <li className="py-2 text-sm text-text-muted">No views yet.</li>
                ) : (
                  data.mostViewed.map((row) => (
                    <li
                      key={row.productId}
                      className="flex items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <Link
                        href={`/admin/products/${row.productId}/edit`}
                        className="min-w-0 truncate font-medium hover:text-brand-primary"
                      >
                        {row.name}
                      </Link>
                      <span className="shrink-0 text-text-muted">
                        {row.views.toLocaleString()} views
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>
            <section className="rounded-lg border border-border bg-surface-raised p-5">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Top categories
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {data.topCategories.length === 0 ? (
                  <li className="py-2 text-sm text-text-muted">No data yet.</li>
                ) : (
                  data.topCategories.map((row) => (
                    <li
                      key={row.category}
                      className="flex items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <span className="font-medium capitalize">
                        {row.category.replace(/_/g, ' ')}
                      </span>
                      <span className="shrink-0 text-text-muted">
                        {row.qty} · {formatEGP(row.revenue)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-border bg-surface-raised p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-text-primary">
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

            <section className="rounded-lg border border-border bg-surface-raised p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-text-primary">
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

          <section className="rounded-lg border border-border bg-surface-raised p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-text-primary">
                  Low stock
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Available qty at or below the settings threshold
                </p>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-medium text-brand-primary hover:underline"
              >
                Products
              </Link>
            </div>
            <div className="mt-4">
              {data.lowStockProducts.length === 0 ? (
                <p className="text-sm text-text-muted">No low-stock products.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.lowStockProducts.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="min-w-0 truncate font-medium text-text-primary hover:text-brand-primary"
                      >
                        {p.name}
                      </Link>
                      <span
                        className={
                          (p.availableQty ?? 0) <= 0
                            ? 'text-sm text-status-error'
                            : 'text-sm text-status-warning'
                        }
                      >
                        {p.availableQty ?? p.stockQty} left
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface-raised p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Recent activity
              </h2>
              <Link
                href="/admin/activity"
                className="text-xs font-medium text-brand-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-4">
              <ActivityFeed items={data.recentActivity ?? []} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
