import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  image: text('image').notNull(),
  seoDescription: text('seo_description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});
