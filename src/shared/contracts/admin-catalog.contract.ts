import { z } from 'zod';

export const productStatusSchema = z.enum([
  'draft',
  'published',
  'hidden',
  'archived',
]);

export type ProductStatus = z.infer<typeof productStatusSchema>;

export const adminProductDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  basePrice: z.number().int(),
  price: z.number().int(),
  compareAtPrice: z.number().int().optional(),
  /** USD source cost — admin only (P24). */
  basePriceUsd: z.number().positive().optional(),
  /** Landed-cost snapshot EGP — admin only (P24). */
  landedCost: z.number().int().optional(),
  sourceProvider: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  sourceProductId: z.string().nullable().optional(),
  sourceInStock: z.boolean().nullable().optional(),
  lastSyncedAt: z.string().nullable().optional(),
  fulfilmentType: z.enum(['local_stock', 'dropship']).optional(),
  preorderEnabled: z.boolean().optional(),
  preorderEtaDays: z.number().int().nullable().optional(),
  description: z.string(),
  images: z.array(z.string()),
  rating: z.number(),
  reviewCount: z.number().int(),
  inStock: z.boolean(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  status: productStatusSchema,
  stockQty: z.number().int(),
  reservedQty: z.number().int().optional(),
  availableQty: z.number().int().optional(),
  slug: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  descriptionFormat: z.enum(['plain', 'html']).optional(),
  archivedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type AdminProductDTO = z.infer<typeof adminProductDtoSchema>;

export const adminProductWriteSchema = z.object({
  name: z.string().trim().min(2),
  categorySlug: z.string().min(1),
  basePrice: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().optional().nullable(),
  basePriceUsd: z.number().positive().optional().nullable(),
  fulfilmentType: z.enum(['local_stock', 'dropship']).optional(),
  preorderEnabled: z.boolean().optional(),
  preorderEtaDays: z.number().int().min(1).max(120).optional().nullable(),
  description: z.string().trim().min(10),
  images: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  stockQty: z.number().int().min(0).optional(),
  status: productStatusSchema.optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case slug')
    .optional()
    .nullable(),
  sku: z.string().trim().min(1).optional().nullable(),
  seoTitle: z.string().trim().optional().nullable(),
  seoDescription: z.string().trim().optional().nullable(),
  ogImage: z.string().trim().optional().nullable(),
  canonicalUrl: z.string().trim().optional().nullable(),
  descriptionFormat: z.enum(['plain', 'html']).optional(),
});

export type AdminProductWrite = z.infer<typeof adminProductWriteSchema>;

export const adminProductBulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(['archive', 'publish', 'hide', 'set-category']),
  payload: z
    .object({
      categorySlug: z.string().min(1).optional(),
    })
    .optional(),
});

export type AdminProductBulk = z.infer<typeof adminProductBulkSchema>;

export const adminProductBulkResultSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      ok: z.boolean(),
      error: z.string().optional(),
    }),
  ),
});

export type AdminProductBulkResult = z.infer<typeof adminProductBulkResultSchema>;

export const adminCsvImportReportSchema = z.object({
  created: z.number().int(),
  updated: z.number().int(),
  errors: z.array(
    z.object({
      row: z.number().int(),
      message: z.string(),
    }),
  ),
});

export type AdminCsvImportReport = z.infer<typeof adminCsvImportReportSchema>;

export const adminMediaDtoSchema = z.object({
  id: z.string(),
  url: z.string(),
  filename: z.string(),
  mime: z.string(),
  size: z.number().int(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  alt: z.string().nullable().optional(),
  folder: z.string().nullable().optional(),
  uploadedBy: z.string(),
  createdAt: z.string(),
});

export type AdminMediaDTO = z.infer<typeof adminMediaDtoSchema>;

export const adminMediaAltUpdateSchema = z.object({
  alt: z.preprocess(
    (value) => (typeof value === 'string' && !value.trim() ? null : value),
    z.string().trim().max(200, 'Alt text must be at most 200 characters').nullable(),
  ),
});

export type AdminMediaAltUpdate = z.infer<typeof adminMediaAltUpdateSchema>;

export const adminCategoryDtoSchema = z.object({
  slug: z.string(),
  name: z.string(),
  image: z.string(),
  seoDescription: z.string(),
  sortOrder: z.number().int(),
});

export type AdminCategoryDTO = z.infer<typeof adminCategoryDtoSchema>;

export const adminCategoryWriteSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case slug'),
  name: z.string().trim().min(2),
  image: z.string().optional(),
  seoDescription: z.string().trim().min(10),
  sortOrder: z.number().int().min(0).optional(),
});

export type AdminCategoryWrite = z.infer<typeof adminCategoryWriteSchema>;

export {
  createPaginatedResponseSchema,
  paginatedSchema,
  type Paginated,
  type PaginationQuery,
  PaginationQuerySchema,
} from './common.contract';

