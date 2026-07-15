import 'server-only';
import { inArray } from 'drizzle-orm';
import {
  createOrderInputSchema,
  type CreateOrderInput,
  type OrderDTO,
} from '@/shared/contracts/order.contract';
import { isFeatureEnabled } from '@/config/features.config';
import { getRequestDb } from '@/server/db/request';
import { products } from '@/server/db/schema';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as ordersRepo from '@/server/repositories/orders.repo';
import type { OrderRow } from '@/server/repositories/orders.repo';

import * as governoratesRepo from '@/server/repositories/governorates.repo';
import {
  computeSellPrice,
  getPricingSettings,
  pricingInputFromRow,
} from '@/server/services/pricing.service';
import { validatePromo } from '@/server/services/promo.service';
import { getShippingCost } from '@/server/services/shipping.service';
import { availableQty, reserveStockForOrder } from '@/server/services/inventory.service';
import { isEffectivelyInStock } from '@/server/lib/stock';
import {
  getOrderTimeline,
  recordOrderStatusChange,
} from '@/server/services/order-timeline.service';
import { createNotification } from '@/server/services/notifications.service';
import * as redemptionsRepo from '@/server/repositories/promo-redemptions.repo';
import { evaluateBundlesForLines } from '@/server/services/bundle.service';
import {
  getOnlinePaymentsAvailability,
} from '@/server/services/paymob.service';
import {
  tryAutoCreateShipment,
  trackingUrlFor,
} from '@/server/services/bosta.service';
import * as shipmentsRepo from '@/server/repositories/shipments.repo';


function generateOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ZN-${stamp}-${random}`;
}

import { toOrderDTO } from '@/server/mappers/order.mapper';


async function trackingForOrder(
  db: Awaited<ReturnType<typeof getRequestDb>>,
  orderId: string,
  orderStatus: OrderRow['status'],
): Promise<OrderDTO['tracking'] | undefined> {
  const shipment = await shipmentsRepo.findShipmentByOrderId(db, orderId);
  if (!shipment?.trackingNumber) return undefined;
  return {
    number: shipment.trackingNumber,
    url: trackingUrlFor(shipment.trackingNumber),
    status: shipment.mappedStatus ?? orderStatus,
  };
}

export async function createOrder(
  raw: unknown,
  userId: string | null,
): Promise<OrderDTO> {
  const parsed = createOrderInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const input: CreateOrderInput = parsed.data;

  const onlineOk = await getOnlinePaymentsAvailability();
  if (input.paymentMethod === 'cod') {
    // always allowed
  } else if (
    (input.paymentMethod === 'card' || input.paymentMethod === 'wallet') &&
    onlineOk
  ) {
    // Paymob path
  } else {
    throw new ValidationError('Only cash on delivery is available right now');
  }

  const db = await getRequestDb();

  const gov = await governoratesRepo.findAllGovernorates(db);
  if (!gov.some((g) => g.id === input.address.governorate)) {
    throw new ValidationError('Please select a valid governorate');
  }

  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const rows = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  if (rows.length !== productIds.length) {
    throw new NotFoundError('One or more products were not found');
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  const pricing = await getPricingSettings(db);
  const preordersOn = isFeatureEnabled('preorders');
  const lineItems: {
    id: string;
    productId: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    isPreorder: boolean;
  }[] = [];

  let subtotal = 0;
  let hasPreorder = false;
  for (const line of input.items) {
    const product = byId.get(line.productId);
    if (!product || product.status !== 'published') {
      throw new NotFoundError(`Product ${line.productId} not found`);
    }
    const available = availableQty(product);
    const preorderOk =
      preordersOn &&
      product.preorderEnabled &&
      available === 0;

    if (available < line.quantity) {
      if (!preorderOk) {
        throw new ConflictError(
          `${product.name} does not have enough stock (available ${available})`,
        );
      }
      // Full-line pre-order only when completely OOS
    } else if (!isEffectivelyInStock(product)) {
      throw new ConflictError(`${product.name} is out of stock`);
    }

    const isPreorder = Boolean(preorderOk);
    if (isPreorder) hasPreorder = true;

    const unitPrice = computeSellPrice(pricingInputFromRow(product), pricing);
    subtotal += unitPrice * line.quantity;
    lineItems.push({
      id: `oi_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      productId: product.id,
      name: product.name,
      image: product.images[0] ?? '',
      unitPrice,
      quantity: line.quantity,
      isPreorder,
    });
  }

  let discount = 0;
  let promoCode: string | null = null;
  if (input.promoCode?.trim()) {
    const promo = await validatePromo(input.promoCode, subtotal);
    if (!promo.valid) {
      throw new ValidationError(promo.error ?? 'Invalid promo code');
    }
    discount = promo.discount ?? 0;
    promoCode = input.promoCode.trim().toUpperCase();
  }

  const bundleResult = await evaluateBundlesForLines(
    db,
    lineItems.map((i) => ({
      productId: i.productId,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
  );
  discount = Math.min(subtotal, discount + bundleResult.discount);

  const shipping = await getShippingCost(
    db,
    input.address.governorate,
    subtotal,
  );
  const total = Math.max(0, subtotal - discount) + shipping;
  const id = generateOrderId();
  const now = new Date();

  await ordersRepo.insertOrder(
    db,
    {
      id,
      userId,
      status: 'placed',
      fullName: input.address.fullName,
      phone: input.address.phone,
      governorateId: input.address.governorate,
      city: input.address.city,
      street: input.address.street,
      addressNotes: input.address.notes ?? null,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'pending',
      subtotal,
      discount,
      shipping,
      total,
      promoCode,
      note: input.note ?? null,
      createdAt: now,
    },
    lineItems.map((i) => ({
      id: i.id,
      orderId: id,
      productId: i.productId,
      name: i.name,
      image: i.image,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      isPreorder: i.isPreorder,
    })),
  );

  const stockLines = lineItems.filter((i) => !i.isPreorder);
  if (stockLines.length > 0) {
    try {
      await reserveStockForOrder(
        db,
        id,
        stockLines.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      );
    } catch (err) {
      await ordersRepo.updateOrderStatus(db, id, 'cancelled');
      throw err;
    }
  }

  await recordOrderStatusChange(db, {
    orderId: id,
    fromStatus: null,
    toStatus: 'placed',
    actor: 'system',
    note: hasPreorder ? 'Order placed (includes pre-order items)' : 'Order placed',
  });

  await createNotification(db, {
    type: 'new_order',
    title: hasPreorder ? 'New pre-order' : 'New order',
    body: `${input.address.fullName} · ${id}`,
    entity: 'order',
    entityId: id,
  });

  if (promoCode) {
    await redemptionsRepo.insertPromoRedemption(db, {
      id: `pr_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      promoCode,
      orderId: id,
      userId,
      discount,
      createdAt: now,
    });
  }

  // COD is ready to fulfil immediately; card/wallet waits for Paymob (then auto-create).
  if (input.paymentMethod === 'cod') {
    await tryAutoCreateShipment(id);
  }

  const created = await ordersRepo.findOrderById(db, id);
  if (!created) throw new Error('Failed to load created order');
  const timeline = await getOrderTimeline(db, id);
  const tracking = await trackingForOrder(db, id, created.order.status);
  return toOrderDTO(created.order, created.items, timeline, tracking);
}

export async function getOrderById(id: string): Promise<OrderDTO> {
  const db = await getRequestDb();
  const found = await ordersRepo.findOrderById(db, id);
  if (!found) throw new NotFoundError('Order not found');
  const timeline = await getOrderTimeline(db, id);
  const tracking = await trackingForOrder(db, id, found.order.status);
  return toOrderDTO(found.order, found.items, timeline, tracking);
}

export async function listOrdersForUser(userId: string): Promise<OrderDTO[]> {
  const db = await getRequestDb();
  const rows = await ordersRepo.findOrdersByUserId(db, userId);
  const result: OrderDTO[] = [];
  for (const { order, items } of rows) {
    const timeline = await getOrderTimeline(db, order.id);
    const tracking = await trackingForOrder(db, order.id, order.status);
    result.push(toOrderDTO(order, items, timeline, tracking));
  }
  return result;
}
