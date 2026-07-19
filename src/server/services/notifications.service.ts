import 'server-only';
import type { AdminNotificationDTO } from '@/shared/contracts/admin-ops-activity.contract';
import { getRequestDb } from '@/server/db/request';
import type { Db } from '@/server/db/client';
import { NotFoundError } from '@/server/http/errors';
import * as notificationsRepo from '@/server/repositories/notifications.repo';
import type { NotificationType } from '@/server/repositories/notifications.repo';

function notificationId(): string {
  return `ntf_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function hrefFor(entity: string, entityId: string): string | undefined {
  switch (entity) {
    case 'order':
      return `/admin/orders/${entityId}`;
    case 'product':
      return `/admin/products/${entityId}/edit`;
    default:
      return undefined;
  }
}

function toDto(row: notificationsRepo.NotificationRow): AdminNotificationDTO {
  const dto: AdminNotificationDTO = {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    entity: row.entity,
    entityId: row.entityId,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  };
  const href = hrefFor(row.entity, row.entityId);
  if (href) dto.href = href;
  return dto;
}

/** Best-effort — never throws to callers. */
export async function createNotification(
  db: Db,
  input: {
    type: NotificationType;
    title: string;
    body: string;
    entity: string;
    entityId: string;
    /** Skip if an unread notification of same type+entity already exists. */
    dedupe?: boolean;
  },
): Promise<void> {
  try {
    if (input.dedupe) {
      const existing = await notificationsRepo.findRecentUnreadOfType(
        db,
        input.type,
        input.entityId,
      );
      if (existing) return;
    }
    await notificationsRepo.insertNotification(db, {
      id: notificationId(),
      type: input.type,
      title: input.title,
      body: input.body,
      entity: input.entity,
      entityId: input.entityId,
    });
  } catch (err) {
    console.error('[notifications]', err);
  }
}

export async function listAdminNotifications(url: URL): Promise<{
  items: AdminNotificationDTO[];
  unreadCount: number;
}> {
  const db = await getRequestDb();
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
  const limit = Number(url.searchParams.get('limit') ?? '30') || 30;
  const [items, unreadCount] = await Promise.all([
    notificationsRepo.listNotifications(db, { unreadOnly, limit }),
    notificationsRepo.countUnread(db),
  ]);
  return { items: items.map(toDto), unreadCount };
}

export async function markNotificationRead(
  id: string,
): Promise<{ ok: true }> {
  const db = await getRequestDb();
  const ok = await notificationsRepo.markRead(db, id);
  if (!ok) throw new NotFoundError('Notification not found');
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: true; count: number }> {
  const db = await getRequestDb();
  const count = await notificationsRepo.markAllRead(db);
  return { ok: true, count };
}
