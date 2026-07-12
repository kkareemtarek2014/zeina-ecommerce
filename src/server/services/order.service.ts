import 'server-only';
import { inArray } from 'drizzle-orm';
import {
  createOrderInputSchema,
  type CreateOrderInput,
  type OrderDTO,
} from '@/shared/contracts/order.contract';
import { getRequestDb } from '@/server/db/request';
import { products } from '@/server/db/schema';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as ordersRepo from '@/server/repositories/orders.repo';
import type { OrderItemRow, OrderRow } from '@/server/repositories/orders.repo';
import * as governoratesRepo from '@/server/repositories/governorates.repo';
import {
  computeSellPrice,
  getProfitMargin,
} from '@/server/services/pricing.service';
import { validatePromo } from '@/server/services/promo.service';
import { getShippingCost } from '@/server/services/shipping.service';
import { availableQty, reserveStockForOrder } from '@/server/services/inventory.service';
import { isEffectivelyInStock } from '@/server/lib/stock';

function generateOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ZN-${stamp}-${random}`;
}

function toOrderDTO(
  order: OrderRow,
  items: OrderItemRow[],
): OrderDTO {
  const dto: OrderDTO = {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
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

export async function createOrder(
  raw: unknown,
  userId: string | null,
): Promise<OrderDTO> {
  const parsed = createOrderInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const input: CreateOrderInput = parsed.data;

  // P4 storefront is COD-only; reject card/wallet until Paymob (P13).
  if (input.paymentMethod !== 'cod') {
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
  const margin = await getProfitMargin(db);
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
  for (const line of input.items) {
    const product = byId.get(line.productId);
    if (!product || product.status !== 'published') {
      throw new NotFoundError(`Product ${line.productId} not found`);
    }
    const available = availableQty(product);
    if (!isEffectivelyInStock(product) || available < line.quantity) {
      throw new ConflictError(
        `${product.name} does not have enough stock (available ${available})`,
      );
    }
    const unitPrice = computeSellPrice(product.basePrice, margin);
    subtotal += unitPrice * line.quantity;
    lineItems.push({
      id: `oi_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      productId: product.id,
      name: product.name,
      image: product.images[0] ?? '',
      unitPrice,
      quantity: line.quantity,
      isPreorder: false,
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
      paymentMethod: 'cod',
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

  try {
    await reserveStockForOrder(
      db,
      id,
      lineItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );
  } catch (err) {
    await ordersRepo.updateOrderStatus(db, id, 'cancelled');
    throw err;
  }

  const created = await ordersRepo.findOrderById(db, id);
  if (!created) throw new Error('Failed to load created order');
  return toOrderDTO(created.order, created.items);
}

export async function getOrderById(id: string): Promise<OrderDTO> {
  const db = await getRequestDb();
  const found = await ordersRepo.findOrderById(db, id);
  if (!found) throw new NotFoundError('Order not found');
  return toOrderDTO(found.order, found.items);
}

export async function listOrdersForUser(userId: string): Promise<OrderDTO[]> {
  const db = await getRequestDb();
  const rows = await ordersRepo.findOrdersByUserId(db, userId);
  return rows.map(({ order, items }) => toOrderDTO(order, items));
}
