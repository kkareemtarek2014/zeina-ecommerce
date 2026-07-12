import 'server-only';
import {
  adminStockAdjustSchema,
  type InventoryMovementDTO,
  type InventoryReason,
} from '@/shared/contracts/admin-inventory.contract';
import type { AdminProductDTO } from '@/shared/contracts/admin-catalog.contract';
import { getRequestDb } from '@/server/db/request';
import type { Db } from '@/server/db/client';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import { availableQty } from '@/server/lib/stock';
import * as inventoryRepo from '@/server/repositories/inventory.repo';
import * as productsRepo from '@/server/repositories/products.repo';
import type { ProductRow } from '@/server/repositories/products.repo';
import type { OrderItemRow } from '@/server/repositories/orders.repo';
import { getAdminProduct } from '@/server/services/admin-catalog.service';
import { eq, sql } from 'drizzle-orm';
import { products, settings } from '@/server/db/schema';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

function toMovementDTO(
  row: inventoryRepo.InventoryMovementRow,
): InventoryMovementDTO {
  const dto: InventoryMovementDTO = {
    id: row.id,
    productId: row.productId,
    oldQty: row.oldQty,
    newQty: row.newQty,
    delta: row.delta,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  };
  if (row.orderId) dto.orderId = row.orderId;
  if (row.actorId) dto.actorId = row.actorId;
  if (row.note) dto.note = row.note;
  return dto;
}

function movementId(): string {
  return `im_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

async function writeMovement(
  db: Db,
  input: {
    productId: string;
    oldQty: number;
    newQty: number;
    reason: InventoryReason;
    orderId?: string | null;
    actorId?: string | null;
    note?: string | null;
  },
): Promise<void> {
  await inventoryRepo.insertMovement(db, {
    id: movementId(),
    productId: input.productId,
    oldQty: input.oldQty,
    newQty: input.newQty,
    delta: input.newQty - input.oldQty,
    reason: input.reason,
    orderId: input.orderId ?? null,
    actorId: input.actorId ?? null,
    note: input.note ?? null,
    createdAt: new Date(),
  });
}

export async function getLowStockThreshold(db?: Db): Promise<number> {
  const database = db ?? (await getRequestDb());
  const rows = await database
    .select()
    .from(settings)
    .where(eq(settings.key, 'low_stock_threshold'))
    .limit(1);
  const value = rows[0]?.value;
  return typeof value === 'number' && value >= 0
    ? value
    : DEFAULT_LOW_STOCK_THRESHOLD;
}

export async function listProductInventory(
  productId: string,
): Promise<InventoryMovementDTO[]> {
  const db = await getRequestDb();
  const product = await productsRepo.findProductByIdAny(db, productId);
  if (!product) throw new NotFoundError('Product not found');
  const rows = await inventoryRepo.findMovementsByProduct(db, productId);
  return rows.map(toMovementDTO);
}

export async function adjustProductStock(
  productId: string,
  raw: unknown,
  actorId: string,
): Promise<AdminProductDTO> {
  const parsed = adminStockAdjustSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const db = await getRequestDb();
  const product = await productsRepo.findProductByIdAny(db, productId);
  if (!product) throw new NotFoundError('Product not found');

  const { delta, reason, note } = parsed.data;
  const oldQty = product.stockQty;
  const newQty = oldQty + delta;
  if (newQty < 0) {
    throw new ValidationError('Stock cannot go below zero');
  }
  if (newQty < product.reservedQty) {
    throw new ConflictError(
      `Stock cannot fall below reserved qty (${product.reservedQty})`,
    );
  }

  const available = newQty - product.reservedQty;
  await productsRepo.updateProduct(db, productId, {
    stockQty: newQty,
    ...(available <= 0 ? { inStock: false } : {}),
  });

  await writeMovement(db, {
    productId,
    oldQty,
    newQty,
    reason,
    actorId,
    note: note ?? null,
  });

  return getAdminProduct(productId);
}

/**
 * Reserve stock for a new order. Aggregates quantities per product first.
 */
export async function reserveStockForOrder(
  db: Db,
  orderId: string,
  items: Pick<OrderItemRow, 'productId' | 'quantity'>[],
): Promise<void> {
  const byProduct = new Map<string, number>();
  for (const item of items) {
    byProduct.set(
      item.productId,
      (byProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }

  for (const [productId, qty] of byProduct) {
    const product = await productsRepo.findProductByIdAny(db, productId);
    if (!product) throw new NotFoundError(`Product ${productId} not found`);

    const available = availableQty(product);
    if (!product.inStock || available < qty) {
      throw new ConflictError(
        `${product.name} does not have enough stock (available ${available})`,
      );
    }

    const newReserved = product.reservedQty + qty;
    await productsRepo.updateProduct(db, productId, {
      reservedQty: newReserved,
      ...(product.stockQty - newReserved <= 0 ? { inStock: false } : {}),
    });

    await writeMovement(db, {
      productId,
      oldQty: product.stockQty,
      newQty: product.stockQty,
      reason: 'reservation',
      orderId,
      note: `Reserved ${qty}`,
    });
  }
}

export async function releaseStockForOrder(
  db: Db,
  orderId: string,
  items: Pick<OrderItemRow, 'productId' | 'quantity'>[],
): Promise<void> {
  const byProduct = new Map<string, number>();
  for (const item of items) {
    byProduct.set(
      item.productId,
      (byProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }

  for (const [productId, qty] of byProduct) {
    const product = await productsRepo.findProductByIdAny(db, productId);
    if (!product) continue;

    const newReserved = Math.max(0, product.reservedQty - qty);
    await productsRepo.updateProduct(db, productId, {
      reservedQty: newReserved,
      ...(product.stockQty - newReserved > 0 ? { inStock: true } : {}),
    });

    await writeMovement(db, {
      productId,
      oldQty: product.stockQty,
      newQty: product.stockQty,
      reason: 'release',
      orderId,
      note: `Released ${qty}`,
    });
  }
}

/** Convert reservations into sales when an order is delivered. */
export async function commitSaleForOrder(
  db: Db,
  orderId: string,
  items: Pick<OrderItemRow, 'productId' | 'quantity'>[],
): Promise<void> {
  const byProduct = new Map<string, number>();
  for (const item of items) {
    byProduct.set(
      item.productId,
      (byProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }

  for (const [productId, qty] of byProduct) {
    const product = await productsRepo.findProductByIdAny(db, productId);
    if (!product) continue;

    const oldQty = product.stockQty;
    const newQty = Math.max(0, oldQty - qty);
    const newReserved = Math.max(0, product.reservedQty - qty);

    await productsRepo.updateProduct(db, productId, {
      stockQty: newQty,
      reservedQty: newReserved,
      inStock: newQty - newReserved > 0,
    });

    await writeMovement(db, {
      productId,
      oldQty,
      newQty,
      reason: 'sale',
      orderId,
      note: `Sold ${qty}`,
    });
  }
}

export async function findLowStockProducts(
  db: Db,
  threshold: number,
  limit = 10,
): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .where(
      sql`(${products.stockQty} - ${products.reservedQty}) <= ${threshold}
          and ${products.status} != 'archived'`,
    )
    .orderBy(sql`(${products.stockQty} - ${products.reservedQty}) asc`)
    .limit(limit);
}

export { availableQty };
