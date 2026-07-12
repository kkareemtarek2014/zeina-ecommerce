import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { orders } from './orders';
import { products } from './products';

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  name: text('name').notNull(),
  image: text('image').notNull(),
  unitPrice: integer('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  isPreorder: integer('is_preorder', { mode: 'boolean' }).notNull().default(false),
});
