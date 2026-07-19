import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  type: text('type', {
    enum: [
      'new_order',
      'low_stock',
      'payment_failed',
      'order_reminder',
      'daily_summary',
    ],
  }).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
