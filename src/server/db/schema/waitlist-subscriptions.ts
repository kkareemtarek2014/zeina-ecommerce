import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { products } from './products';

export const waitlistSubscriptions = sqliteTable(
  'waitlist_subscriptions',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    notifiedAt: integer('notified_at', { mode: 'timestamp_ms' }),
  },
  (t) => [
    uniqueIndex('waitlist_product_email_uidx').on(t.productId, t.email),
  ],
);
