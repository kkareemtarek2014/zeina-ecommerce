import { desc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { inventoryMovements } from '@/server/db/schema';

export type InventoryMovementRow = typeof inventoryMovements.$inferSelect;

export async function insertMovement(
  db: Db,
  row: typeof inventoryMovements.$inferInsert,
): Promise<InventoryMovementRow> {
  await db.insert(inventoryMovements).values(row);
  const rows = await db
    .select()
    .from(inventoryMovements)
    .where(eq(inventoryMovements.id, row.id as string))
    .limit(1);
  const created = rows[0];
  if (!created) throw new Error('Failed to create inventory movement');
  return created;
}

export async function findMovementsByProduct(
  db: Db,
  productId: string,
  limit = 50,
): Promise<InventoryMovementRow[]> {
  return db
    .select()
    .from(inventoryMovements)
    .where(eq(inventoryMovements.productId, productId))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(limit);
}
