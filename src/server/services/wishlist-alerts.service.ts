import 'server-only';
import {
  wishlistAlertToggleSchema,
  type WishlistAlertDTO,
} from '@/shared/contracts/wishlist-alerts.contract';
import { getRequestDb } from '@/server/db/request';
import { ValidationError } from '@/server/http/errors';
import * as wishlistAlertsRepo from '@/server/repositories/wishlist-alerts.repo';

export async function getUserAlertPreferences(
  userId: string,
): Promise<WishlistAlertDTO[]> {
  const db = await getRequestDb();
  const rows = await wishlistAlertsRepo.listUserAlerts(db, userId);
  return rows.map((r) => ({
    productId: r.productId,
    alertType: r.alertType,
    enabled: r.enabled,
  }));
}

export async function toggleWishlistAlert(
  userId: string,
  raw: unknown,
): Promise<WishlistAlertDTO> {
  const parsed = wishlistAlertToggleSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const row = await wishlistAlertsRepo.upsertAlert(
    db,
    userId,
    parsed.data.productId,
    parsed.data.alertType,
    parsed.data.enabled,
  );
  return {
    productId: row.productId,
    alertType: row.alertType,
    enabled: row.enabled,
  };
}
