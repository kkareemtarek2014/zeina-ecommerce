import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { products } from './products';
import { orders } from './orders';
import { users } from './users';

export const inventoryMovements = sqliteTable('inventory_movements', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  oldQty: integer('old_qty').notNull(),
  newQty: integer('new_qty').notNull(),
  delta: integer('delta').notNull(),
  reason: text('reason', {
    enum: [
      'restock',
      'sale',
      'adjustment',
      'return',
      'reservation',
      'release',
    ],
  }).notNull(),
  orderId: text('order_id').references(() => orders.id),
  actorId: text('actor_id').references(() => users.id),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
