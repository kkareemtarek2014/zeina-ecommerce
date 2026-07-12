import { z } from 'zod';

export const productDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number().int(),
  compareAtPrice: z.number().int().optional(),
  description: z.string(),
  images: z.array(z.string()),
  rating: z.number(),
  reviewCount: z.number().int(),
  inStock: z.boolean(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type ProductDTO = z.infer<typeof productDtoSchema>;

export const productListQuerySchema = z.object({
  category: z.string().optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'rating']).optional(),
  q: z.string().optional(),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const categorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  image: z.string(),
  seoDescription: z.string(),
});

export type CategoryDTO = z.infer<typeof categorySchema>;

export const governorateSchema = z.object({
  id: z.string(),
  name: z.string(),
  zone: z.enum(['cairo_giza', 'near', 'far']),
});

export type GovernorateDTO = z.infer<typeof governorateSchema>;
