import 'server-only';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import type {
  AdminActivityItem,
  AdminAuditLogDTO,
} from '@/shared/contracts/admin-ops-activity.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';
import { getRequestDb } from '@/server/db/request';
import { auditLog, users } from '@/server/db/schema';

function hrefFor(entity: string, entityId: string): string | undefined {
  switch (entity) {
    case 'product':
      return `/admin/products/${entityId}/edit`;
    case 'category':
      return `/admin/categories/${entityId}/edit`;
    case 'order':
      return `/admin/orders/${entityId}`;
    case 'user':
      return `/admin/users/${entityId}`;
    case 'promo':
      return `/admin/promos`;
    case 'settings':
      return `/admin/settings`;
    case 'governorate':
    case 'shipping_zone':
      return `/admin/locations`;
    case 'homepage_block':
      return `/admin/homepage`;
    case 'temu_import':
      return `/admin/products/${entityId}/edit`;
    default:
      return undefined;
  }
}

function summarize(
  action: string,
  entity: string,
  entityId: string,
  actorName: string | null,
): string {
  const who = actorName?.trim() || 'Someone';
  const target = entityId.length > 24 ? `${entityId.slice(0, 20)}…` : entityId;
  switch (action) {
    case 'create':
      return `${who} created ${entity} ${target}`;
    case 'update':
      return `${who} updated ${entity} ${target}`;
    case 'delete':
      return `${who} deleted ${entity} ${target}`;
    case 'status_change':
      return `${who} changed status on ${entity} ${target}`;
    default:
      return `${who} ${action} ${entity} ${target}`;
  }
}

export async function listAdminActivity(
  limit = 20,
): Promise<AdminActivityItem[]> {
  const db = await getRequestDb();
  const rows = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      createdAt: auditLog.createdAt,
      actorName: users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorId, users.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(Math.min(50, Math.max(1, limit)));

  return rows.map((row) => {
    const item: AdminActivityItem = {
      id: row.id,
      actorId: row.actorId,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      summary: summarize(
        row.action,
        row.entity,
        row.entityId,
        row.actorName,
      ),
      createdAt: row.createdAt.toISOString(),
    };
    if (row.actorName) item.actorName = row.actorName;
    const href = hrefFor(row.entity, row.entityId);
    if (href) item.href = href;
    return item;
  });
}

export async function listAdminAuditLog(url: URL): Promise<Paginated<AdminAuditLogDTO>> {
  const db = await getRequestDb();
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get('pageSize') ?? '20') || 20),
  );
  const entity = url.searchParams.get('entity') ?? undefined;
  const actorId = url.searchParams.get('actorId') ?? undefined;
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

  const conditions = [];
  if (entity) conditions.push(eq(auditLog.entity, entity));
  if (actorId) conditions.push(eq(auditLog.actorId, actorId));
  if (dateFrom) {
    const ms = Date.parse(dateFrom);
    if (!Number.isNaN(ms)) conditions.push(gte(auditLog.createdAt, new Date(ms)));
  }
  if (dateTo) {
    const ms = Date.parse(dateTo);
    if (!Number.isNaN(ms)) conditions.push(lte(auditLog.createdAt, new Date(ms)));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [agg] = await db
    .select({ total: count() })
    .from(auditLog)
    .where(where);
  const total = Number(agg?.total ?? 0);

  const rows = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      meta: auditLog.meta,
      createdAt: auditLog.createdAt,
      actorName: users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorId, users.id))
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const items: AdminAuditLogDTO[] = rows.map((row) => {
    const dto: AdminAuditLogDTO = {
      id: row.id,
      actorId: row.actorId,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      createdAt: row.createdAt.toISOString(),
    };
    if (row.actorName) dto.actorName = row.actorName;
    if (row.meta) dto.meta = row.meta;
    return dto;
  });

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
