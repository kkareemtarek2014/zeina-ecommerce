import 'server-only';
import { and, count, desc, gte, ne, sql } from 'drizzle-orm';
import type { AdminStatsDTO } from '@/shared/contracts/admin-stats.contract';
import { ORDER_STATUS_FLOW } from '@/shared/contracts/admin-ops.contract';
import type { OrderStatus } from '@/shared/contracts/admin-ops.contract';
import { getRequestDb } from '@/server/db/request';
import { orders, products, users } from '@/server/db/schema';
import * as ordersRepo from '@/server/repositories/orders.repo';
import { toAdminOrderDTO } from '@/server/services/admin-orders.service';
import {
  computeSellPrice,
  getProfitMargin,
} from '@/server/services/pricing.service';
import {
  findLowStockProducts,
  getLowStockThreshold,
} from '@/server/services/inventory.service';
import { availableQty, isEffectivelyInStock } from '@/server/lib/stock';
import type { ProductRow } from '@/server/repositories/products.repo';
import type { AdminProductDTO } from '@/shared/contracts/admin-catalog.contract';

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled'];

function toAdminProduct(row: ProductRow, margin: number): AdminProductDTO {
  const dto: AdminProductDTO = {
    id: row.id,
    name: row.name,
    category: row.categorySlug,
    basePrice: row.basePrice,
    price: computeSellPrice(row.basePrice, margin),
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

export async function getAdminStats(): Promise<AdminStatsDTO> {
  const db = await getRequestDb();
  const margin = await getProfitMargin(db);

  const [ordersCountRow] = await db.select({ value: count() }).from(orders);
  const [productsCountRow] = await db.select({ value: count() }).from(products);
  const [usersCountRow] = await db.select({ value: count() }).from(users);

  const [revenueRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(ne(orders.status, 'cancelled'));

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
    .where(and(ne(orders.status, 'cancelled'), gte(orders.createdAt, start)))
    .groupBy(sql`strftime('%Y-%m-%d', ${orders.createdAt} / 1000, 'unixepoch')`);

  const salesMap = new Map(
    salesRows.map((r) => [r.day, Number(r.total) || 0]),
  );
  const salesByDay = dayKeys.map((date) => ({
    date,
    total: salesMap.get(date) ?? 0,
  }));

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

  const latestProductRows = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(5);

  const threshold = await getLowStockThreshold(db);
  const lowStockRows = await findLowStockProducts(db, threshold, 8);

  return {
    revenueTotal: Number(revenueRow?.value ?? 0),
    ordersCount: ordersCountRow?.value ?? 0,
    productsCount: productsCountRow?.value ?? 0,
    usersCount: usersCountRow?.value ?? 0,
    ordersByStatus,
    recentOrders,
    latestProducts: latestProductRows.map((r) => toAdminProduct(r, margin)),
    lowStockProducts: lowStockRows.map((r) => toAdminProduct(r, margin)),
    salesByDay,
  };
}
