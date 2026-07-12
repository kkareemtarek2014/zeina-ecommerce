import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const shippingZones = sqliteTable('shipping_zones', {
  zone: text('zone', {
    enum: ['cairo_giza', 'near', 'far'],
  }).primaryKey(),
  label: text('label').notNull(),
  fee: integer('fee').notNull(),
});
