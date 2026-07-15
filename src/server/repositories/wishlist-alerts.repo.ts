import 'server-only';
import { and, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { wishlistAlerts } from '@/server/db/schema';
import type { WishlistAlertType } from '@/shared/contracts/wishlist-alerts.contract';

export type WishlistAlertRow = typeof wishlistAlerts.$inferSelect;

function alertId(): string {
  return `wala_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export async function upsertAlert(
  db: Db,
  userId: string,
  productId: string,
  alertType: WishlistAlertType,
  enabled: boolean,
): Promise<WishlistAlertRow> {
  const existing = await db
    .select()
    .from(wishlistAlerts)
    .where(
      and(
        eq(wishlistAlerts.userId, userId),
        eq(wishlistAlerts.productId, productId),
        eq(wishlistAlerts.alertType, alertType),
      ),
    )
    .limit(1);

  const row = existing[0];
  if (row) {
    await db
      .update(wishlistAlerts)
      .set({ enabled })
      .where(eq(wishlistAlerts.id, row.id));
    return { ...row, enabled };
  }

  const id = alertId();
  const createdAt = new Date();
  await db.insert(wishlistAlerts).values({
    id,
    userId,
    productId,
    alertType,
    enabled,
    createdAt,
  });
  return {
    id,
    userId,
    productId,
    alertType,
    enabled,
    lastNotifiedAt: null,
    createdAt,
  };
}

export async function listUserAlerts(
  db: Db,
  userId: string,
): Promise<WishlistAlertRow[]> {
  return db
    .select()
    .from(wishlistAlerts)
    .where(eq(wishlistAlerts.userId, userId));
}
