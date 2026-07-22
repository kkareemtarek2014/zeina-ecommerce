import 'server-only';
import { and, asc, count, desc, eq, gte, inArray, lt, ne, sql } from 'drizzle-orm';
import type { AdminStatsDTO } from '@/shared/contracts/admin-stats.contract';
import { ORDER_STATUS_FLOW } from '@/shared/contracts/admin-ops.contract';
import type { OrderStatus } from '@/shared/contracts/admin-ops.contract';
import { getRequestDb } from '@/server/db/request';
import {
  orderItems,
  orders,
  products,
  users,
} from '@/server/db/schema';
import * as ordersRepo from '@/server/repositories/orders.repo';
import { toAdminOrderDTO } from '@/server/services/admin-orders.service';
import {
  computeSellPrice,
  getPricingSettings,
  pricingInputFromRow,
  type PricingSettings,
} from '@/server/services/pricing.service';
import {
  findLowStockProducts,
  getLowStockThreshold,
} from '@/server/services/inventory.service';
import { listAdminActivity } from '@/server/services/admin-activity.service';
import { availableQty, isEffectivelyInStock } from '@/server/lib/stock';
import type { ProductRow } from '@/server/repositories/products.repo';
import type { AdminProductDTO } from '@/shared/contracts/admin-catalog.contract';
import { findMostViewed } from '@/server/repositories/product-views.repo';

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled'];

function toAdminProduct(row: ProductRow, pricing: PricingSettings): AdminProductDTO {
  const dto: AdminProductDTO = {
    id: row.id,
    name: row.name,
    category: row.categorySlug,
    basePrice: row.basePrice,
    price: computeSellPrice(pricingInputFromRow(row), pricing),
    description: row.description,
    images: row.images ?? [],
    rating: row.rating,
    reviewCount: row.reviewCount,
    inStock: isEffectivelyInStock(row),
    status: row.status,
    stockQty: row.stockQty,
    reservedQty: row.reservedQty,
    availableQty: availableQty(row),
    createdAt: row.createdAt.toISOString(),
  };
  if (row.compareAtPrice != null) dto.compareAtPrice = row.compareAtPrice;
  if (row.featured) dto.featured = true;
  if (row.tags?.length) dto.tags = row.tags;
  if (row.slug) dto.slug = row.slug;
  if (row.sku) dto.sku = row.sku;
  if (row.basePriceUsd != null) dto.basePriceUsd = row.basePriceUsd;
  if (row.landedCost != null) dto.landedCost = row.landedCost;
  return dto;
}

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function last14DayKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i),
    );
    keys.push(utcDayKey(d));
  }
  return keys;
}

function startOfUtcDay(d = new Date()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function startOfUtcMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function daysAgoUtc(days: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - days,
    ),
  );
}

/** Percent change; null when both periods are empty. */
function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : 100;
  return Math.round(((current - previous) / previous) * 100);
}

const COD_OPEN_STATUSES = [
  'placed',
  'confirmed',
  'sourced',
  'shipped',
  'out_for_delivery',
] as const satisfies ReadonlyArray<OrderStatus>;

const NEEDS_ACTION_STATUSES = [
  'placed',
  'confirmed',
] as const satisfies ReadonlyArray<OrderStatus>;

export async function getAdminStats(): Promise<AdminStatsDTO> {
  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);

  const [ordersCountRow] = await db.select({ value: count() }).from(orders);
  const [productsCountRow] = await db.select({ value: count() }).from(products);
  const [usersCountRow] = await db.select({ value: count() }).from(users);

  const nonCancelled = ne(orders.status, 'cancelled');

  const [revenueRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(nonCancelled);

  const todayStart = startOfUtcDay();
  const yesterdayStart = daysAgoUtc(1);
  const [revenueTodayRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(and(nonCancelled, gte(orders.createdAt, todayStart)));

  const [revenueYesterdayRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(
      and(
        nonCancelled,
        gte(orders.createdAt, yesterdayStart),
        lt(orders.createdAt, todayStart),
      ),
    );

  const monthStart = startOfUtcMonth();
  const [revenueMonthRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(and(nonCancelled, gte(orders.createdAt, monthStart)));

  // Previous calendar month-to-date (same UTC day-of-month window).
  const now = new Date();
  const dayOfMonth = now.getUTCDate();
  const prevMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const prevMonthMtdEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, dayOfMonth + 1),
  );
  const [revenuePrevMonthMtdRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(
      and(
        nonCancelled,
        gte(orders.createdAt, prevMonthStart),
        lt(orders.createdAt, prevMonthMtdEnd),
      ),
    );

  const [avgRow] = await db
    .select({
      value: sql<number>`coalesce(avg(${orders.total}), 0)`,
      n: count(),
    })
    .from(orders)
    .where(nonCancelled);
  const avgOrderValue =
    (avgRow?.n ?? 0) > 0 ? Math.round(Number(avgRow?.value ?? 0)) : 0;

  const last30Start = daysAgoUtc(30);
  const prior30Start = daysAgoUtc(60);
  const [avgLast30Row] = await db
    .select({
      value: sql<number>`coalesce(avg(${orders.total}), 0)`,
      n: count(),
    })
    .from(orders)
    .where(and(nonCancelled, gte(orders.createdAt, last30Start)));
  const [avgPrior30Row] = await db
    .select({
      value: sql<number>`coalesce(avg(${orders.total}), 0)`,
      n: count(),
    })
    .from(orders)
    .where(
      and(
        nonCancelled,
        gte(orders.createdAt, prior30Start),
        lt(orders.createdAt, last30Start),
      ),
    );
  const avgLast30 =
    (avgLast30Row?.n ?? 0) > 0
      ? Math.round(Number(avgLast30Row?.value ?? 0))
      : 0;
  const avgPrior30 =
    (avgPrior30Row?.n ?? 0) > 0
      ? Math.round(Number(avgPrior30Row?.value ?? 0))
      : 0;

  const [codToCollectRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(
      and(
        eq(orders.paymentMethod, 'cod'),
        eq(orders.paymentStatus, 'pending'),
        inArray(orders.status, [...COD_OPEN_STATUSES]),
      ),
    );

  const [newCustomersRow] = await db
    .select({ value: count() })
    .from(users)
    .where(gte(users.createdAt, daysAgoUtc(30)));

  const statusRows = await db
    .select({
      status: orders.status,
      value: count(),
    })
    .from(orders)
    .groupBy(orders.status);

  const ordersByStatus = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, 0]),
  ) as Record<OrderStatus, number>;
  for (const row of statusRows) {
    ordersByStatus[row.status] = row.value;
  }

  const dayKeys = last14DayKeys();
  const start = new Date(`${dayKeys[0]}T00:00:00.000Z`);
  const salesRows = await db
    .select({
      day: sql<string>`strftime('%Y-%m-%d', ${orders.createdAt} / 1000, 'unixepoch')`,
      total: sql<number>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(and(nonCancelled, gte(orders.createdAt, start)))
    .groupBy(sql`strftime('%Y-%m-%d', ${orders.createdAt} / 1000, 'unixepoch')`);

  const salesMap = new Map(
    salesRows.map((r) => [r.day, Number(r.total) || 0]),
  );
  const salesByDay = dayKeys.map((date) => ({
    date,
    total: salesMap.get(date) ?? 0,
  }));

  const bestSellerRows = await db
    .select({
      productId: orderItems.productId,
      name: sql<string>`max(${orderItems.name})`,
      image: sql<string | null>`max(${orderItems.image})`,
      qty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
      revenue: sql<number>`coalesce(sum(${orderItems.unitPrice} * ${orderItems.quantity}), 0)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(nonCancelled)
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  const topCategoryRows = await db
    .select({
      category: products.categorySlug,
      qty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
      revenue: sql<number>`coalesce(sum(${orderItems.unitPrice} * ${orderItems.quantity}), 0)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(nonCancelled)
    .groupBy(products.categorySlug)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  const recentOrderRows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const recentOrders = [];
  for (const order of recentOrderRows) {
    const found = await ordersRepo.findOrderById(db, order.id);
    if (found) recentOrders.push(toAdminOrderDTO(found.order, found.items));
  }

  const needsActionRows = await db
    .select()
    .from(orders)
    .where(inArray(orders.status, [...NEEDS_ACTION_STATUSES]))
    .orderBy(asc(orders.createdAt))
    .limit(5);

  const needsActionOrders = [];
  for (const order of needsActionRows) {
    const found = await ordersRepo.findOrderById(db, order.id);
    if (found) {
      needsActionOrders.push(toAdminOrderDTO(found.order, found.items));
    }
  }

  const latestProductRows = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(5);

  const threshold = await getLowStockThreshold(db);
  const lowStockRows = await findLowStockProducts(db, threshold, 8);
  const [lowStockCountRow] = await db
    .select({ value: count() })
    .from(products)
    .where(
      sql`(${products.stockQty} - ${products.reservedQty}) <= ${threshold}
          and ${products.status} != 'archived'`,
    );
  const recentActivity = await listAdminActivity(8);
  const mostViewedRows = await findMostViewed(db, 5);

  const revenueToday = Number(revenueTodayRow?.value ?? 0);
  const revenueYesterday = Number(revenueYesterdayRow?.value ?? 0);
  const revenueThisMonth = Number(revenueMonthRow?.value ?? 0);
  const revenuePrevMonthMtd = Number(revenuePrevMonthMtdRow?.value ?? 0);

  return {
    revenueTotal: Number(revenueRow?.value ?? 0),
    revenueToday,
    revenueThisMonth,
    avgOrderValue,
    revenueTodayDeltaPct: percentDelta(revenueToday, revenueYesterday),
    revenueThisMonthDeltaPct: percentDelta(
      revenueThisMonth,
      revenuePrevMonthMtd,
    ),
    avgOrderValueDeltaPct: percentDelta(avgLast30, avgPrior30),
    codToCollect: Number(codToCollectRow?.value ?? 0),
    lowStockCount: lowStockCountRow?.value ?? 0,
    ordersCount: ordersCountRow?.value ?? 0,
    productsCount: productsCountRow?.value ?? 0,
    usersCount: usersCountRow?.value ?? 0,
    newCustomers: newCustomersRow?.value ?? 0,
    ordersByStatus,
    recentOrders,
    needsActionOrders,
    latestProducts: latestProductRows.map((r) => toAdminProduct(r, pricing)),
    lowStockProducts: lowStockRows.map((r) => toAdminProduct(r, pricing)),
    bestSellers: bestSellerRows.map((r) => ({
      productId: r.productId,
      name: r.name,
      ...(r.image ? { image: r.image } : {}),
      qty: Number(r.qty) || 0,
      revenue: Number(r.revenue) || 0,
    })),
    mostViewed: mostViewedRows.map((r) => ({
      productId: r.productId,
      name: r.name,
      ...(r.image ? { image: r.image } : {}),
      views: r.views,
    })),
    topCategories: topCategoryRows.map((r) => ({
      category: r.category,
      qty: Number(r.qty) || 0,
      revenue: Number(r.revenue) || 0,
    })),
    recentActivity,
    salesByDay,
  };
}
