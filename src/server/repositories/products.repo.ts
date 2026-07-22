import { and, asc, count, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { orderItems, products } from '@/server/db/schema';

export type ProductRow = typeof products.$inferSelect;

export type ProductListFilters = {
  category?: string;
  featured?: boolean;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  q?: string;
  /** Storefront default is published. Admin may pass a status or `all`. */
  status?: 'published' | 'draft' | 'hidden' | 'archived' | 'all';
  inStock?: boolean;
  /** Admin: available qty (stock − reserved) ≤ threshold. */
  lowStock?: boolean;
  lowStockThreshold?: number;
};

export async function findProducts(
  db: Db,
  filters: ProductListFilters = {},
): Promise<ProductRow[]> {
  const status = filters.status ?? 'published';
  const conditions =
    status === 'all' ? [] : [eq(products.status, status)];

  if (filters.category) {
    conditions.push(eq(products.categorySlug, filters.category));
  }
  if (filters.featured === true) {
    conditions.push(eq(products.featured, true));
  }
  if (filters.inStock === true) {
    conditions.push(eq(products.inStock, true));
  }
  if (filters.inStock === false) {
    conditions.push(eq(products.inStock, false));
  }
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${products.name}) like ${q} or lower(${products.categorySlug}) like ${q} or lower(coalesce(${products.tags}, '')) like ${q})`,
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  switch (filters.sort) {
    case 'newest':
      return db.select().from(products).where(where).orderBy(desc(products.createdAt));
    case 'price-asc':
      return db.select().from(products).where(where).orderBy(asc(products.basePrice));
    case 'price-desc':
      return db.select().from(products).where(where).orderBy(desc(products.basePrice));
    case 'rating':
      return db.select().from(products).where(where).orderBy(desc(products.rating));
    default:
      return db.select().from(products).where(where);
  }
}

export async function findProductById(
  db: Db,
  id: string,
): Promise<ProductRow | null> {
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.id, id),
        inArray(products.status, ['published', 'hidden']),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function findRelatedProducts(
  db: Db,
  id: string,
  categorySlug: string,
  limit = 4,
): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'published'),
        eq(products.categorySlug, categorySlug),
        ne(products.id, id),
      ),
    )
    .limit(limit);
}

export async function findNewArrivals(db: Db, limit = 8): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.status, 'published'))
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

export async function searchProducts(
  db: Db,
  query: string,
  limit = 8,
): Promise<ProductRow[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pattern = `%${q}%`;
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'published'),
        sql`(lower(${products.name}) like ${pattern} or lower(${products.categorySlug}) like ${pattern} or lower(coalesce(${products.tags}, '')) like ${pattern})`,
      ),
    )
    .limit(limit);
}

export async function findProductByIdAny(
  db: Db,
  id: string,
): Promise<ProductRow | null> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findProductsAdmin(
  db: Db,
  filters: ProductListFilters & { page?: number; pageSize?: number } = {},
): Promise<{ rows: ProductRow[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const conditions = [];

  if (!filters.status) {
    conditions.push(ne(products.status, 'archived'));
  } else if (filters.status !== 'all') {
    conditions.push(eq(products.status, filters.status));
  }
  if (filters.category) {
    conditions.push(eq(products.categorySlug, filters.category));
  }
  if (filters.featured === true) {
    conditions.push(eq(products.featured, true));
  }
  if (filters.inStock === true) {
    conditions.push(eq(products.inStock, true));
  }
  if (filters.inStock === false) {
    conditions.push(eq(products.inStock, false));
  }
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${products.name}) like ${q}
        or lower(${products.categorySlug}) like ${q}
        or lower(coalesce(${products.sku}, '')) like ${q}
        or lower(coalesce(${products.tags}, '')) like ${q}
        or lower(${products.description}) like ${q})`,
    );
  }
  if (filters.lowStock === true && filters.lowStockThreshold != null) {
    conditions.push(
      sql`(${products.stockQty} - ${products.reservedQty}) <= ${filters.lowStockThreshold}`,
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const [agg] = await db.select({ total: count() }).from(products).where(where);
  const total = Number(agg?.total ?? 0);

  const orderBy =
    filters.lowStock === true
      ? asc(sql`(${products.stockQty} - ${products.reservedQty})`)
      : filters.sort === 'price-asc'
        ? asc(products.basePrice)
        : filters.sort === 'price-desc'
          ? desc(products.basePrice)
          : filters.sort === 'rating'
            ? desc(products.rating)
            : desc(products.createdAt);

  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total };
}

export async function insertProduct(
  db: Db,
  row: typeof products.$inferInsert,
): Promise<ProductRow> {
  await db.insert(products).values(row);
  const created = await findProductByIdAny(db, row.id as string);
  if (!created) throw new Error('Failed to create product');
  return created;
}

export async function updateProduct(
  db: Db,
  id: string,
  patch: Partial<typeof products.$inferInsert>,
): Promise<ProductRow> {
  await db.update(products).set(patch).where(eq(products.id, id));
  const updated = await findProductByIdAny(db, id);
  if (!updated) throw new Error('Product not found after update');
  return updated;
}

/**
 * Atomically reserve `qty` units. Single conditional UPDATE so concurrent
 * checkouts can't oversell. Returns true only if the reservation was applied
 * (product published, in stock, enough available).
 */
export async function reserveProductStock(
  db: Db,
  id: string,
  qty: number,
): Promise<boolean> {
  const res = (await db.run(sql`
    UPDATE products
    SET reserved_qty = reserved_qty + ${qty},
        in_stock = CASE
          WHEN (stock_qty - (reserved_qty + ${qty})) > 0 THEN in_stock
          ELSE 0
        END
    WHERE id = ${id}
      AND in_stock = 1
      AND status = 'published'
      AND (stock_qty - reserved_qty) >= ${qty}
  `)) as { meta?: { changes?: number } };
  return (res.meta?.changes ?? 0) > 0;
}

/** Atomically release `qty` reserved units (never below zero); re-enable stock if available. */
export async function releaseProductStock(
  db: Db,
  id: string,
  qty: number,
): Promise<void> {
  await db.run(sql`
    UPDATE products
    SET reserved_qty = MAX(0, reserved_qty - ${qty}),
        in_stock = CASE
          WHEN (stock_qty - MAX(0, reserved_qty - ${qty})) > 0 THEN 1
          ELSE in_stock
        END
    WHERE id = ${id}
  `);
}

export async function deleteProduct(db: Db, id: string): Promise<boolean> {
  const result = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning({ id: products.id });
  return result.length > 0;
}

export async function findProductBySlug(
  db: Db,
  slug: string,
  excludeId?: string,
): Promise<ProductRow | null> {
  const conditions = [eq(products.slug, slug)];
  if (excludeId) conditions.push(ne(products.id, excludeId));
  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .limit(1);
  return rows[0] ?? null;
}

export async function findProductBySku(
  db: Db,
  sku: string,
  excludeId?: string,
): Promise<ProductRow | null> {
  const conditions = [eq(products.sku, sku)];
  if (excludeId) conditions.push(ne(products.id, excludeId));
  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .limit(1);
  return rows[0] ?? null;
}

export async function countOrderItemsForProduct(
  db: Db,
  productId: string,
): Promise<number> {
  const [agg] = await db
    .select({ c: count() })
    .from(orderItems)
    .where(eq(orderItems.productId, productId));
  return Number(agg?.c ?? 0);
}

export async function countProductsByCategory(
  db: Db,
  categorySlug: string,
): Promise<number> {
  const [agg] = await db
    .select({ c: count() })
    .from(products)
    .where(eq(products.categorySlug, categorySlug));
  return Number(agg?.c ?? 0);
}

/**
 * Site-wide review aggregate from denormalized `products.rating` /
 * `reviewCount` (published catalog only) — weighted average, never fake.
 * Used for the homepage rating strip; returns count 0 when nothing to show.
 */
export async function siteRatingAggregate(
  db: Db,
): Promise<{ average: number; count: number }> {
  const [agg] = await db
    .select({
      weighted: sql<number>`sum(${products.rating} * ${products.reviewCount})`,
      total: sql<number>`sum(${products.reviewCount})`,
    })
    .from(products)
    .where(eq(products.status, 'published'));

  const total = Number(agg?.total ?? 0);
  const weighted = Number(agg?.weighted ?? 0);
  const average = total > 0 ? Math.round((weighted / total) * 10) / 10 : 0;
  return { average, count: total };
}
