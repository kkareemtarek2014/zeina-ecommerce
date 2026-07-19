import 'server-only';
import { getRequestDb } from '@/server/db/request';
import { auditLog } from '@/server/db/schema';

export type AuditAction = 'create' | 'update' | 'delete' | 'status_change';

export type AuditEntity =
  | 'product'
  | 'category'
  | 'order'
  | 'user'
  | 'promo'
  | 'governorate'
  | 'shipping_zone'
  | 'settings'
  | 'inventory'
  | 'media'
  | 'homepage_block'
  | 'temu_import'
  | 'bundle'
  | 'shipment';

/**
 * Best-effort audit write. Never throws to the caller — mutations must succeed even if logging fails.
 */
export async function writeAuditLog(input: {
  actorId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const db = await getRequestDb();
    await db.insert(auditLog).values({
      id: `aud_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      meta: input.meta ?? null,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[audit_log]', err);
  }
}
