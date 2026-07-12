import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { governorates } from './governorates';

export const addresses = sqliteTable('addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  governorateId: text('governorate_id')
    .notNull()
    .references(() => governorates.id),
  city: text('city').notNull(),
  street: text('street').notNull(),
});
