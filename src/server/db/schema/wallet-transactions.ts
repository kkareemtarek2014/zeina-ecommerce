import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const walletTransactions = sqliteTable('wallet_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['credit', 'debit'],
  }).notNull(),
  amount: integer('amount').notNull(),
  description: text('description').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
