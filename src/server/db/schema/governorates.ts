import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const governorates = sqliteTable('governorates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  zone: text('zone', {
    enum: ['cairo_giza', 'near', 'far'],
  }).notNull(),
});
