import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const promos = sqliteTable('promos', {
  code: text('code').primaryKey(),
  type: text('type', {
    enum: ['percentage', 'fixed'],
  }).notNull(),
  value: real('value').notNull(),
  minOrderValue: integer('min_order_value'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});
