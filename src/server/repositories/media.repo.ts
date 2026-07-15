import { and, count, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { mediaAssets, products, categories } from '@/server/db/schema';

export type MediaAssetRow = typeof mediaAssets.$inferSelect;

export async function insertMedia(
  db: Db,
  row: typeof mediaAssets.$inferInsert,
): Promise<MediaAssetRow> {
  await db.insert(mediaAssets).values(row);
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, row.id as string))
    .limit(1);
  const created = rows[0];
  if (!created) throw new Error('Failed to create media asset');
  return created;
}

export async function findMediaById(
  db: Db,
  id: string,
): Promise<MediaAssetRow | null> {
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listMedia(
  db: Db,
  opts: { page?: number; pageSize?: number; q?: string } = {},
): Promise<{ rows: MediaAssetRow[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 24));
  const conditions = [];
  if (opts.q?.trim()) {
    const q = `%${opts.q.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${mediaAssets.filename}) like ${q} or lower(coalesce(${mediaAssets.alt}, '')) like ${q} or lower(coalesce(${mediaAssets.folder}, '')) like ${q})`,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const [agg] = await db.select({ total: count() }).from(mediaAssets).where(where);
  const total = Number(agg?.total ?? 0);
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(where)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { rows, total };
}

export async function deleteMedia(db: Db, id: string): Promise<boolean> {
  const result = await db
    .delete(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .returning({ id: mediaAssets.id });
  return result.length > 0;
}

export async function updateMediaAlt(
  db: Db,
  id: string,
  alt: string | null,
): Promise<MediaAssetRow | null> {
  const result = await db
    .update(mediaAssets)
    .set({ alt })
    .where(eq(mediaAssets.id, id))
    .returning();
  return result[0] ?? null;
}

/** True if any product image JSON or category image references this URL. */
export async function isMediaUrlReferenced(
  db: Db,
  url: string,
): Promise<boolean> {
  const productHits = await db
    .select({ id: products.id })
    .from(products)
    .where(sql`instr(${products.images}, ${url}) > 0`)
    .limit(1);
  if (productHits.length > 0) return true;
  const catHits = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(eq(categories.image, url))
    .limit(1);
  return catHits.length > 0;
}
