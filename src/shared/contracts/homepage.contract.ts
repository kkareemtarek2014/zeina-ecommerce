import { z } from 'zod';

export const HOMEPAGE_BLOCK_TYPES = [
  'hero',
  'categories',
  'featured',
  'new_arrivals',
  'collection',
  'promo',
] as const;

export type HomepageBlockType = (typeof HOMEPAGE_BLOCK_TYPES)[number];

export const heroBlockConfigSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(500).optional(),
  image: z.string().trim().min(1).max(500).optional(),
  ctaLabel: z.string().trim().max(80).optional(),
  ctaHref: z.string().trim().max(300).optional(),
  secondaryCtaLabel: z.string().trim().max(80).optional(),
  secondaryCtaHref: z.string().trim().max(300).optional(),
});

export const categoriesBlockConfigSchema = z.object({
  title: z.string().trim().max(120).optional(),
  eyebrow: z.string().trim().max(60).optional(),
});

export const featuredBlockConfigSchema = z.object({
  title: z.string().trim().max(120).optional(),
  productIds: z.array(z.string().trim().min(1)).max(24).optional(),
});

export const newArrivalsBlockConfigSchema = z.object({
  title: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(24).optional(),
});

export const collectionBlockConfigSchema = z.object({
  title: z.string().trim().max(120).optional(),
  categorySlug: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
});

export const promoBlockConfigSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(500).optional(),
  image: z.string().trim().min(1).max(500).optional(),
  ctaLabel: z.string().trim().max(80).optional(),
  ctaHref: z.string().trim().max(300).optional(),
});

export function configSchemaForType(type: HomepageBlockType) {
  switch (type) {
    case 'hero':
      return heroBlockConfigSchema;
    case 'categories':
      return categoriesBlockConfigSchema;
    case 'featured':
      return featuredBlockConfigSchema;
    case 'new_arrivals':
      return newArrivalsBlockConfigSchema;
    case 'collection':
      return collectionBlockConfigSchema;
    case 'promo':
      return promoBlockConfigSchema;
  }
}

export type HeroBlockConfig = z.infer<typeof heroBlockConfigSchema>;
export type CategoriesBlockConfig = z.infer<
  typeof categoriesBlockConfigSchema
>;
export type FeaturedBlockConfig = z.infer<typeof featuredBlockConfigSchema>;
export type NewArrivalsBlockConfig = z.infer<
  typeof newArrivalsBlockConfigSchema
>;
export type CollectionBlockConfig = z.infer<typeof collectionBlockConfigSchema>;
export type PromoBlockConfig = z.infer<typeof promoBlockConfigSchema>;

export type HomepageBlockConfig =
  | HeroBlockConfig
  | CategoriesBlockConfig
  | FeaturedBlockConfig
  | NewArrivalsBlockConfig
  | CollectionBlockConfig
  | PromoBlockConfig;

export const homepageBlockDTOSchema = z.object({
  id: z.string(),
  type: z.enum(HOMEPAGE_BLOCK_TYPES),
  position: z.number().int(),
  config: z.record(z.string(), z.unknown()),
  active: z.boolean(),
  createdAt: z.string(),
});

export type HomepageBlockDTO = z.infer<typeof homepageBlockDTOSchema>;

export const homepageBlockWriteSchema = z.object({
  type: z.enum(HOMEPAGE_BLOCK_TYPES),
  config: z.record(z.string(), z.unknown()),
  active: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export type HomepageBlockWrite = z.infer<typeof homepageBlockWriteSchema>;

export const homepageBlockUpdateSchema = z.object({
  type: z.enum(HOMEPAGE_BLOCK_TYPES).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  active: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export type HomepageBlockUpdate = z.infer<typeof homepageBlockUpdateSchema>;

export const homepageReorderSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1),
});

export type HomepageReorder = z.infer<typeof homepageReorderSchema>;
