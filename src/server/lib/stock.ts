import type { ProductRow } from '@/server/repositories/products.repo';

export function availableQty(row: {
  stockQty: number;
  reservedQty: number;
}): number {
  return Math.max(0, row.stockQty - row.reservedQty);
}

export function isEffectivelyInStock(row: ProductRow): boolean {
  return row.inStock && availableQty(row) > 0;
}
