import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { categories } from './categories';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  categorySlug: text('category_slug')
    .notNull()
    .references(() => categories.slug),
  basePrice: integer('base_price').notNull(),
  compareAtPrice: integer('compare_at_price'),
  description: text('description').notNull(),
  images: text('images', { mode: 'json' }).$type<string[]>().notNull(),
  rating: real('rating').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  slug: text('slug').unique(),
  sku: text('sku').unique(),
  status: text('status', {
    enum: ['draft', 'published', 'hidden', 'archived'],
  })
    .notNull()
    .default('draft'),
  stockQty: integer('stock_qty').notNull().default(0),
  reservedQty: integer('reserved_qty').notNull().default(0),
});
