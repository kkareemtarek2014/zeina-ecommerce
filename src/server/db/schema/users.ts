import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  role: text('role', {
    enum: ['customer', 'admin'],
  })
    .notNull()
    .default('customer'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
