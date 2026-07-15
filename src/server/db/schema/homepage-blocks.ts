import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Keep in sync with HOMEPAGE_BLOCK_TYPES in shared/contracts/homepage.contract.ts.
export const HOMEPAGE_BLOCK_TYPES = [
  'hero',
  'categories',
  'featured',
  'new_arrivals',
  'collection',
  'promo',
] as const;

export type HomepageBlockType = (typeof HOMEPAGE_BLOCK_TYPES)[number];

export const homepageBlocks = sqliteTable('homepage_blocks', {
  id: text('id').primaryKey(),
  type: text('type', {
    enum: HOMEPAGE_BLOCK_TYPES,
  }).notNull(),
  position: integer('position').notNull().default(0),
  config: text('config', { mode: 'json' })
    .$type<Record<string, unknown>>()
    .notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
