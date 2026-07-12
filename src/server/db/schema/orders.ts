import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { governorates } from './governorates';

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status', {
    enum: [
      'placed',
      'confirmed',
      'sourced',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ],
  })
    .notNull()
    .default('placed'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  governorateId: text('governorate_id')
    .notNull()
    .references(() => governorates.id),
  city: text('city').notNull(),
  street: text('street').notNull(),
  addressNotes: text('address_notes'),
  paymentMethod: text('payment_method', {
    enum: ['cod', 'card', 'wallet'],
  })
    .notNull()
    .default('cod'),
  paymentStatus: text('payment_status', {
    enum: ['pending', 'paid', 'failed', 'refunded'],
  })
    .notNull()
    .default('pending'),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  shipping: integer('shipping').notNull(),
  total: integer('total').notNull(),
  promoCode: text('promo_code'),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
