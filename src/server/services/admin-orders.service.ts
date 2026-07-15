import 'server-only';
import {
  adminOrderStatusPatchSchema,
  isOrderStatusTransitionAllowed,
  type AdminOrderDTO,
  type OrderStatus,
} from '@/shared/contracts/admin-ops.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';
import { orderStatusSchema } from '@/shared/contracts/order.contract';
import { getRequestDb } from '@/server/db/request';
import {
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as ordersRepo from '@/server/repositories/orders.repo';
import type { OrderRow } from '@/server/repositories/orders.repo';

import { ok } from '@/server/http/envelope';
import {
  commitSaleForOrder,
  releaseStockForOrder,
} from '@/server/services/inventory.service';
import {
  getOrderTimeline,
  recordOrderStatusChange,
} from '@/server/services/order-timeline.service';


import { parsePaginationFromUrl, buildPaginatedResult } from '@/server/utils/pagination';
import { toAdminOrderDTO } from '@/server/mappers/order.mapper';


async function hydrateOrders(
  db: Awaited<ReturnType<typeof getRequestDb>>,
  rows: OrderRow[],
): Promise<AdminOrderDTO[]> {
  const result: AdminOrderDTO[] = [];
  for (const order of rows) {
    const found = await ordersRepo.findOrderById(db, order.id);
    if (found) result.push(toAdminOrderDTO(found.order, found.items));
  }
  return result;
}

export async function listAdminOrders(url: URL) {
  const db = await getRequestDb();
  const { page, pageSize } = parsePaginationFromUrl(url);
  const q = url.searchParams.get('q') ?? undefined;
  const statusRaw = url.searchParams.get('status');
  const governorate = url.searchParams.get('governorate') ?? undefined;
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');
  const preorderOnly =
    url.searchParams.get('preorder') === '1' ||
    url.searchParams.get('preorder') === 'true';

  let status: OrderStatus | undefined;
  if (statusRaw) {
    const parsed = orderStatusSchema.safeParse(statusRaw);
    if (!parsed.success) {
      throw new ValidationError('Invalid status filter');
    }
    status = parsed.data;
  }

  let dateFromMs: number | undefined;
  let dateToMs: number | undefined;
  if (dateFrom) {
    const d = Date.parse(dateFrom);
    if (Number.isNaN(d)) throw new ValidationError('Invalid dateFrom');
    dateFromMs = d;
  }
  if (dateTo) {
    const d = Date.parse(dateTo);
    if (Number.isNaN(d)) throw new ValidationError('Invalid dateTo');
    // Inclusive end-of-day if date-only (YYYY-MM-DD)
    dateToMs =
      /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? d + 24 * 60 * 60 * 1000 - 1 : d;
  }

  const { rows, total, page: p, pageSize: ps } = await ordersRepo.listAdminOrders(
    db,
    {
      q,
      status,
      governorate,
      dateFromMs,
      dateToMs,
      preorderOnly,
      page,
      pageSize,
    },
  );

  const items = await hydrateOrders(db, rows);
  const data: Paginated<AdminOrderDTO> = buildPaginatedResult({
    items,
    total,
    page: p,
    pageSize: ps,
  });
  return ok(data);
}


export async function getAdminOrder(id: string): Promise<AdminOrderDTO> {
  const db = await getRequestDb();
  const found = await ordersRepo.findOrderById(db, id);
  if (!found) throw new NotFoundError('Order not found');
  const timeline = await getOrderTimeline(db, id);
  return toAdminOrderDTO(found.order, found.items, timeline);
}

export async function patchAdminOrderStatus(
  id: string,
  body: unknown,
  actorId: string,
): Promise<AdminOrderDTO> {
  const parsed = adminOrderStatusPatchSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const db = await getRequestDb();
  const found = await ordersRepo.findOrderById(db, id);
  if (!found) throw new NotFoundError('Order not found');

  const next = parsed.data.status;
  const current = found.order.status;
  if (!isOrderStatusTransitionAllowed(current, next)) {
    throw new ValidationError(
      `Cannot change status from ${current} to ${next}`,
    );
  }

  if (current === next) {
    const timeline = await getOrderTimeline(db, id);
    return toAdminOrderDTO(found.order, found.items, timeline);
  }

  const updated = await ordersRepo.updateOrderStatus(db, id, next);
  if (!updated) throw new NotFoundError('Order not found');

  await recordOrderStatusChange(db, {
    orderId: id,
    fromStatus: current,
    toStatus: next,
    actor: 'admin',
    actorId,
  });

  if (next === 'cancelled') {
    await releaseStockForOrder(db, id, found.items);
  } else if (next === 'delivered') {
    await commitSaleForOrder(db, id, found.items);
  }

  const timeline = await getOrderTimeline(db, id);
  return toAdminOrderDTO(updated, found.items, timeline);
}

export { toAdminOrderDTO };
