import type { OrderDTO } from '@/shared/contracts/order.contract';
import type { AdminOrderDTO } from '@/shared/contracts/admin-ops.contract';
import type { OrderItemRow, OrderRow } from '@/server/repositories/orders.repo';
import type { OrderTimelineEntry } from '@/shared/contracts/order.contract';

export function mapOrderItems(items: OrderItemRow[]) {
  return items.map((i) => ({
    productId: i.productId,
    name: i.name,
    image: i.image,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    ...(i.isPreorder ? { isPreorder: true } : {}),
  }));
}

export function mapOrderAddress(order: OrderRow) {
  return {
    fullName: order.fullName,
    phone: order.phone,
    governorate: order.governorateId,
    city: order.city,
    street: order.street,
    ...(order.addressNotes ? { notes: order.addressNotes } : {}),
  };
}

export function toOrderDTO(
  order: OrderRow,
  items: OrderItemRow[],
  timeline?: OrderTimelineEntry[],
  tracking?: OrderDTO['tracking'],
): OrderDTO {
  const dto: OrderDTO = {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    items: mapOrderItems(items),
    address: mapOrderAddress(order),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
  };
  if (order.promoCode) dto.promoCode = order.promoCode;
  if (order.note) dto.note = order.note;
  if (timeline?.length) dto.timeline = timeline;
  if (tracking) dto.tracking = tracking;
  return dto;
}

export function toAdminOrderDTO(
  order: OrderRow,
  items: OrderItemRow[],
  timeline?: OrderTimelineEntry[],
): AdminOrderDTO {
  const dto: AdminOrderDTO = {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    userId: order.userId,
    items: mapOrderItems(items),
    address: mapOrderAddress(order),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
  };
  if (order.promoCode) dto.promoCode = order.promoCode;
  if (order.note) dto.note = order.note;
  if (timeline?.length) dto.timeline = timeline;
  return dto;
}
