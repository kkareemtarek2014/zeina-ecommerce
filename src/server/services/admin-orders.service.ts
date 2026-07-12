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
import type { OrderItemRow, OrderRow } from '@/server/repositories/orders.repo';
import { ok } from '@/server/http/envelope';
import {
  commitSaleForOrder,
  releaseStockForOrder,
} from '@/server/services/inventory.service';

function toAdminOrderDTO(order: OrderRow, items: OrderItemRow[]): AdminOrderDTO {
  const dto: AdminOrderDTO = {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    userId: order.userId,
    items: items.map((i) => ({
      productId: i.productId,
      name: i.name,
      image: i.image,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
    address: {
      fullName: order.fullName,
      phone: order.phone,
      governorate: order.governorateId,
      city: order.city,
      street: order.street,
      ...(order.addressNotes ? { notes: order.addressNotes } : {}),
    },
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
  };
  if (order.promoCode) dto.promoCode = order.promoCode;
  if (order.note) dto.note = order.note;
  return dto;
}

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
  const page = Number(url.searchParams.get('page') ?? '1') || 1;
  const pageSize = Number(url.searchParams.get('pageSize') ?? '20') || 20;
  const q = url.searchParams.get('q') ?? undefined;
  const statusRaw = url.searchParams.get('status');
  const governorate = url.searchParams.get('governorate') ?? undefined;
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

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
      page,
      pageSize,
    },
  );

  const items = await hydrateOrders(db, rows);
  const data: Paginated<AdminOrderDTO> = {
    items,
    page: p,
    pageSize: ps,
    total,
    totalPages: Math.max(1, Math.ceil(total / ps)),
  };
  return ok(data);
}

export async function getAdminOrder(id: string): Promise<AdminOrderDTO> {
  const db = await getRequestDb();
  const found = await ordersRepo.findOrderById(db, id);
  if (!found) throw new NotFoundError('Order not found');
  return toAdminOrderDTO(found.order, found.items);
}

export async function patchAdminOrderStatus(
  id: string,
  body: unknown,
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
    return toAdminOrderDTO(found.order, found.items);
  }

  const updated = await ordersRepo.updateOrderStatus(db, id, next);
  if (!updated) throw new NotFoundError('Order not found');

  if (next === 'cancelled') {
    await releaseStockForOrder(db, id, found.items);
  } else if (next === 'delivered') {
    await commitSaleForOrder(db, id, found.items);
  }

  return toAdminOrderDTO(updated, found.items);
}

export { toAdminOrderDTO };
