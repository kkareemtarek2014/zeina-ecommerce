import { and, eq, isNull } from 'drizzle-orm';
import { count } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { waitlistSubscriptions } from '@/server/db/schema';

function waitlistId(): string {
  return `wl_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

/** Idempotent subscribe — upserts on (product_id, email). */
export async function subscribe(
  db: Db,
  productId: string,
  email: string,
): Promise<{ id: string }> {
  const existing = await db
    .select({ id: waitlistSubscriptions.id })
    .from(waitlistSubscriptions)
    .where(
      and(
        eq(waitlistSubscriptions.productId, productId),
        eq(waitlistSubscriptions.email, email),
      ),
    )
    .limit(1);

  if (existing[0]) {
    return { id: existing[0].id };
  }

  const id = waitlistId();
  await db.insert(waitlistSubscriptions).values({
    id,
    productId,
    email,
    createdAt: new Date(),
  });
  return { id };
}

/** Check if an email is subscribed to a product's waitlist. */
export async function isSubscribed(
  db: Db,
  productId: string,
  email: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: waitlistSubscriptions.id })
    .from(waitlistSubscriptions)
    .where(
      and(
        eq(waitlistSubscriptions.productId, productId),
        eq(waitlistSubscriptions.email, email),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Count un-notified subscribers for a product. */
export async function countForProduct(
  db: Db,
  productId: string,
): Promise<number> {
  const result = await db
    .select({ total: count() })
    .from(waitlistSubscriptions)
    .where(
      and(
        eq(waitlistSubscriptions.productId, productId),
        isNull(waitlistSubscriptions.notifiedAt),
      ),
    );
  return result[0]?.total ?? 0;
}

/** List un-notified subscribers for batch notify. */
export async function getSubscribers(
  db: Db,
  productId: string,
): Promise<Array<{ id: string; email: string }>> {
  return db
    .select({
      id: waitlistSubscriptions.id,
      email: waitlistSubscriptions.email,
    })
    .from(waitlistSubscriptions)
    .where(
      and(
        eq(waitlistSubscriptions.productId, productId),
        isNull(waitlistSubscriptions.notifiedAt),
      ),
    );
}

/** Batch mark all subscribers for a product as notified. */
export async function markNotified(
  db: Db,
  productId: string,
): Promise<void> {
  await db
    .update(waitlistSubscriptions)
    .set({ notifiedAt: new Date() })
    .where(
      and(
        eq(waitlistSubscriptions.productId, productId),
        isNull(waitlistSubscriptions.notifiedAt),
      ),
    );
}
