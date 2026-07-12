import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const bridalRequests = sqliteTable('bridal_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  weddingDate: text('wedding_date'),
  description: text('description').notNull(),
  fileKey: text('file_key'),
  fileName: text('file_name'),
  fileType: text('file_type'),
  status: text('status', {
    enum: ['pending', 'answered'],
  })
    .notNull()
    .default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
