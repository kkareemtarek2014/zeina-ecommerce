import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { products } from './products';

export const wishlistAlerts = sqliteTable(
  'wishlist_alerts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    alertType: text('alert_type', {
      enum: ['price_drop', 'restock'],
    }).notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    lastNotifiedAt: integer('last_notified_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [
    uniqueIndex('wishlist_alerts_user_product_type_uidx').on(
      t.userId,
      t.productId,
      t.alertType,
    ),
    index('idx_wishlist_alerts_product').on(t.productId),
    index('idx_wishlist_alerts_user').on(t.userId),
  ],
);
