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
  /**
   * Server-derived: available qty ≤ settings lowStockThreshold while still in stock.
   * Never expose raw qty on the storefront.
   */
  lowStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  descriptionFormat: z.enum(['plain', 'html']).optional(),
  fulfilmentType: z.enum(['local_stock', 'dropship']).optional(),
  shippingEta: z.string().optional(),
  /** Pre-order available when OOS (flag-gated server-side). */
  preorderAvailable: z.boolean().optional(),
  preorderEtaDays: z.number().int().optional(),
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

/** Admin locations — includes Bosta mapping (P14). */
export const adminGovernorateDtoSchema = governorateSchema.extend({
  bostaCityId: z.string().nullable().optional(),
  bostaZone: z.string().nullable().optional(),
  bostaDistrict: z.string().nullable().optional(),
});

export type AdminGovernorateDTO = z.infer<typeof adminGovernorateDtoSchema>;
