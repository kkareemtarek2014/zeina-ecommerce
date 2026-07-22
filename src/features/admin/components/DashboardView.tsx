'use client';

import Link from 'next/link';
import {
  ShoppingBag,
  AlertTriangle,
  Package,
  TrendingUp,
  Calendar,
  Hash,
  Percent,
  Banknote,
} from 'lucide-react';
import { ActivityFeed } from './ActivityFeed';
import {
  AdminPageHeader,
  ActionCard,
  StatChip,
  SectionCard,
  StatusPill,
  EmptyState,
} from './ui';
import { RecentOrders } from './RecentOrders';
import { OrderQuickActions } from './OrderQuickActions';
import { ORDER_STATUS_LABELS } from './OrderStatusSelect';
import { SalesChart } from './SalesChart';
import { useAdminStats } from '../hooks/useAdminOps';
import {
  ORDER_STATUS_FLOW,
  type OrderStatus,
} from '@/shared/contracts/admin-ops.contract';
import { isFeatureEnabled } from '@/config/features.config';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
} from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled'];

const DASHBOARD_TABS = [
  { id: 'orders', label: 'Recent orders' },
  { id: 'sellers', label: 'Best sellers' },
  { id: 'viewed', label: 'Most viewed' },
  { id: 'stock', label: 'Low stock' },
  { id: 'activity', label: 'Activity' },
] as const;

function DashboardSkeleton() {
  return (
    <div className="mt-6 space-y-6 animate-fade-up" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

export function DashboardView() {
  const { data, isLoading, isError } = useAdminStats();

  const needsAction = data
    ? (data.ordersByStatus.placed ?? 0) + (data.ordersByStatus.confirmed ?? 0)
    : 0;
  const lowStockCount = data?.lowStockCount ?? data?.lowStockProducts.length ?? 0;
  const pendingPickup = data?.ordersByStatus.sourced ?? 0;
  const hasAttention =
    needsAction > 0 || lowStockCount > 0 || pendingPickup > 0;
  const shipmentsHref = isFeatureEnabled('bosta_shipping')
    ? '/admin/shipments'
    : '/admin/orders?status=sourced';

  return (
    <div>
      <AdminPageHeader
        title="Today"
        subtitle="Do what needs attention, then watch sales — browse the rest below."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Today' }]}
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <p className="mt-6 text-sm text-status-error">
          Failed to load dashboard statistics.
        </p>
      ) : (
        <div className="mt-6 space-y-6 animate-fade-up">
          {/* Action strip */}
          {hasAttention ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {needsAction > 0 && (
                <ActionCard
                  title="Orders waiting confirmation"
                  count={needsAction}
                  icon={ShoppingBag}
                  href="/admin/orders?status=placed"
                  cta="Review"
                />
              )}
              {lowStockCount > 0 && (
                <ActionCard
                  title="Products low on stock"
                  count={lowStockCount}
                  icon={AlertTriangle}
                  href="/admin/products?lowStock=1"
                  cta="Restock"
                />
              )}
              {pendingPickup > 0 && (
                <ActionCard
                  title="Shipments pending pickup"
                  count={pendingPickup}
                  icon={Package}
                  href={shipmentsHref}
                  cta="View"
                />
              )}
            </div>
          ) : (
            <SectionCard className="border-status-success/30 bg-status-success/5">
              <div className="flex items-center gap-3">
                <span className="text-xl" aria-hidden>
                  ✨
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    All clear
                  </h3>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    No orders need action and stock looks healthy.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Stat chips + deltas + COD */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatChip
              label="Today revenue"
              value={formatEGP(data.revenueToday)}
              icon={Calendar}
              hint="vs yesterday"
              {...(data.revenueTodayDeltaPct != null
                ? { delta: data.revenueTodayDeltaPct }
                : {})}
            />
            <StatChip
              label="This month"
              value={formatEGP(data.revenueThisMonth)}
              icon={TrendingUp}
              hint="vs prior MTD"
              {...(data.revenueThisMonthDeltaPct != null
                ? { delta: data.revenueThisMonthDeltaPct }
                : {})}
            />
            <StatChip
              label="Orders"
              value={data.ordersCount.toLocaleString()}
              icon={Hash}
              hint="All time"
            />
            <StatChip
              label="Avg order"
              value={formatEGP(data.avgOrderValue)}
              icon={Percent}
              hint="30d vs prior 30d"
              {...(data.avgOrderValueDeltaPct != null
                ? { delta: data.avgOrderValueDeltaPct }
                : {})}
            />
            <StatChip
              label="COD to collect"
              value={formatEGP(data.codToCollect)}
              icon={Banknote}
              hint="Open unpaid COD"
            />
          </div>

          {/* Needs-action queue */}
          {data.needsActionOrders.length > 0 ? (
            <SectionCard
              title="Needs action"
              description="Oldest placed and confirmed orders — advance without leaving Today"
              action={
                <Link
                  href="/admin/orders?status=placed"
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  All waiting
                </Link>
              }
            >
              <ul className="divide-y divide-border">
                {data.needsActionOrders.map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order.id)}`}
                        className="font-medium text-text-primary hover:text-brand-primary"
                      >
                        {order.id}
                      </Link>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {order.address.fullName} ·{' '}
                        {ORDER_STATUS_LABELS[order.status]} ·{' '}
                        {formatEGP(order.total)}
                        {order.paymentMethod === 'cod' ? ' · COD' : ''}
                      </p>
                    </div>
                    <OrderQuickActions
                      orderId={order.id}
                      status={order.status}
                      size="sm"
                    />
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {/* Chart + status funnel */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Sales (14 days)"
              description="Daily revenue from completed orders"
            >
              <div className="mt-1 h-64">
                <SalesChart data={data.salesByDay} />
              </div>
            </SectionCard>

            <SectionCard
              title="Order status"
              description="Jump to filtered orders"
              action={
                <Link
                  href="/admin/orders"
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  All orders
                </Link>
              }
            >
              <ul className="divide-y divide-border">
                {ALL_STATUSES.map((status) => {
                  const count = data.ordersByStatus[status] ?? 0;
                  return (
                    <li key={status}>
                      <Link
                        href={`/admin/orders?status=${status}`}
                        className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-brand-blush/40 -mx-1 px-1 rounded-(--radius)"
                      >
                        <StatusPill status={status} size="sm" />
                        <span className="font-display text-sm font-semibold tabular-nums text-text-primary">
                          {count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          </div>

          {/* 4.4 Tabbed lists */}
          <SectionCard>
            <Tabs defaultValue="orders" variant="line">
              <TabsList className="w-full">
                {DASHBOARD_TABS.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="orders">
                <div className="mb-3 flex justify-end">
                  <Link
                    href="/admin/orders"
                    className="text-xs font-semibold text-brand-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
                {data.recentOrders.length === 0 ? (
                  <EmptyState
                    emoji="🛒"
                    title="No orders yet"
                    description="New orders will show up here."
                    action={{ label: 'Open orders', href: '/admin/orders' }}
                    className="border-0 bg-transparent p-6"
                  />
                ) : (
                  <RecentOrders orders={data.recentOrders} />
                )}
              </TabsContent>

              <TabsContent value="sellers">
                <div className="mb-3 flex justify-end">
                  <Link
                    href="/admin/products"
                    className="text-xs font-semibold text-brand-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
                {data.bestSellers.length === 0 ? (
                  <EmptyState
                    emoji="🏆"
                    title="No sales yet"
                    description="Best sellers appear once orders are delivered."
                    className="border-0 bg-transparent p-6"
                  />
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {data.bestSellers.map((row) => (
                      <li
                        key={row.productId}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <Link
                          href={`/admin/products/${row.productId}/edit`}
                          className="min-w-0 truncate font-medium hover:text-brand-primary"
                        >
                          {row.name}
                        </Link>
                        <span className="shrink-0 text-xs text-text-secondary">
                          {row.qty} sold · {formatEGP(row.revenue)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="viewed">
                <div className="mb-3 flex justify-end">
                  <Link
                    href="/admin/products"
                    className="text-xs font-semibold text-brand-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
                {data.mostViewed.length === 0 ? (
                  <EmptyState
                    emoji="👀"
                    title="No page views yet"
                    description="Product views will appear as shoppers browse."
                    className="border-0 bg-transparent p-6"
                  />
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {data.mostViewed.map((row) => (
                      <li
                        key={row.productId}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <Link
                          href={`/admin/products/${row.productId}/edit`}
                          className="min-w-0 truncate font-medium hover:text-brand-primary"
                        >
                          {row.name}
                        </Link>
                        <span className="shrink-0 text-xs text-text-secondary">
                          {row.views.toLocaleString()} views
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="stock">
                <div className="mb-3 flex justify-end">
                  <Link
                    href="/admin/products?lowStock=1"
                    className="text-xs font-semibold text-brand-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
                {data.lowStockProducts.length === 0 ? (
                  <EmptyState
                    emoji="📦"
                    title="Stock looks healthy"
                    description="Nothing is at or below the low-stock threshold."
                    className="border-0 bg-transparent p-6"
                  />
                ) : (
                  <ul className="divide-y divide-border text-sm">
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
                              ? 'text-xs font-bold text-status-error'
                              : 'text-xs font-semibold text-status-warning'
                          }
                        >
                          {p.availableQty ?? p.stockQty} left
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="activity">
                <div className="mb-3 flex justify-end">
                  <Link
                    href="/admin/activity"
                    className="text-xs font-semibold text-brand-primary hover:underline"
                  >
                    Full audit log
                  </Link>
                </div>
                {(data.recentActivity ?? []).length === 0 ? (
                  <EmptyState
                    emoji="📝"
                    title="No recent activity"
                    description="Admin actions will show up in this feed."
                    action={{ label: 'Open activity', href: '/admin/activity' }}
                    className="border-0 bg-transparent p-6"
                  />
                ) : (
                  <ActivityFeed items={data.recentActivity ?? []} />
                )}
              </TabsContent>
            </Tabs>
          </SectionCard>

        </div>
      )}
    </div>
  );
}
