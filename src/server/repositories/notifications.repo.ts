import { and, count, desc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { notifications } from '@/server/db/schema';

export type NotificationRow = typeof notifications.$inferSelect;

export type NotificationType =
  | 'new_order'
  | 'low_stock'
  | 'payment_failed'
  | 'order_reminder'
  | 'daily_summary';

export async function insertNotification(
  db: Db,
  input: {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    entity: string;
    entityId: string;
    createdAt?: Date;
  },
): Promise<NotificationRow> {
  await db.insert(notifications).values({
    id: input.id,
    type: input.type,
    title: input.title,
    body: input.body,
    entity: input.entity,
    entityId: input.entityId,
    read: false,
    createdAt: input.createdAt ?? new Date(),
  });
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, input.id))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error('Failed to create notification');
  return row;
}

export async function listNotifications(
  db: Db,
  opts: { unreadOnly?: boolean; limit?: number } = {},
): Promise<NotificationRow[]> {
  const limit = Math.min(100, Math.max(1, opts.limit ?? 30));
  const conditions = opts.unreadOnly
    ? [eq(notifications.read, false)]
    : [];
  const where = conditions.length ? and(...conditions) : undefined;
  return db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnread(db: Db): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(eq(notifications.read, false));
  return Number(row?.value ?? 0);
}

export async function markRead(db: Db, id: string): Promise<boolean> {
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, id))
    .returning({ id: notifications.id });
  return result.length > 0;
}

export async function markAllRead(db: Db): Promise<number> {
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.read, false))
    .returning({ id: notifications.id });
  return result.length;
}

export async function findRecentUnreadOfType(
  db: Db,
  type: NotificationType,
  entityId: string,
): Promise<NotificationRow | null> {
  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.type, type),
        eq(notifications.entityId, entityId),
        eq(notifications.read, false),
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
