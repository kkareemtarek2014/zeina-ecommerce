import { z } from 'zod';
import { governorateSchema } from '@/shared/contracts/product.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';

export { type Paginated };
export { governorateSchema };

export const shippingZoneSchema = z.object({
  zone: z.enum(['cairo_giza', 'near', 'far']),
  label: z.string(),
  fee: z.number().int().min(0),
});

export type ShippingZoneDTO = z.infer<typeof shippingZoneSchema>;

export const adminGovernorateWriteSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9_]+$/, 'Use lowercase id (letters, numbers, underscore)'),
  name: z.string().trim().min(2),
  zone: z.enum(['cairo_giza', 'near', 'far']),
});

export type AdminGovernorateWrite = z.infer<typeof adminGovernorateWriteSchema>;

export const adminGovernorateUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  zone: z.enum(['cairo_giza', 'near', 'far']).optional(),
});

export const adminShippingZoneFeeSchema = z.object({
  fee: z.number().int().min(0),
});

export const adminPromoDtoSchema = z.object({
  code: z.string(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number(),
  minOrderValue: z.number().int().optional(),
  active: z.boolean(),
});

export type AdminPromoDTO = z.infer<typeof adminPromoDtoSchema>;

export const adminPromoWriteSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .transform((c) => c.toUpperCase()),
    type: z.enum(['percentage', 'fixed']),
    value: z.number().positive(),
    minOrderValue: z.number().int().positive().optional().nullable(),
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'percentage' && (data.value <= 0 || data.value > 1)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Percentage value must be between 0 and 1 (e.g. 0.1 = 10%)',
        path: ['value'],
      });
    }
  });

export type AdminPromoWrite = z.infer<typeof adminPromoWriteSchema>;

export const adminPromoUpdateSchema = z
  .object({
    type: z.enum(['percentage', 'fixed']).optional(),
    value: z.number().positive().optional(),
    minOrderValue: z.number().int().positive().optional().nullable(),
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === 'percentage' &&
      data.value != null &&
      (data.value <= 0 || data.value > 1)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Percentage value must be between 0 and 1 (e.g. 0.1 = 10%)',
        path: ['value'],
      });
    }
  });

export const adminPromoActiveSchema = z.object({
  active: z.boolean(),
});

export const adminBridalRequestDtoSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  fullName: z.string(),
  phone: z.string(),
  weddingDate: z.string().nullable().optional(),
  description: z.string(),
  fileName: z.string().nullable().optional(),
  fileType: z.string().nullable().optional(),
  mediaUrl: z.string().nullable().optional(),
  status: z.enum(['pending', 'answered']),
  createdAt: z.string(),
});

export type AdminBridalRequestDTO = z.infer<typeof adminBridalRequestDtoSchema>;

export const adminBridalStatusSchema = z.object({
  status: z.enum(['pending', 'answered']),
});

export const adminSettingsDtoSchema = z.object({
  profitMargin: z.number(),
  freeShippingThreshold: z.number().int(),
  lowStockThreshold: z.number().int(),
  siteName: z.string(),
  siteTagline: z.string(),
  siteUrl: z.string(),
});

export type AdminSettingsDTO = z.infer<typeof adminSettingsDtoSchema>;

export const adminSettingsWriteSchema = z.object({
  profitMargin: z.number().min(0.2).max(0.3).optional(),
  freeShippingThreshold: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  siteName: z.string().trim().min(1).optional(),
  siteTagline: z.string().trim().min(1).optional(),
  siteUrl: z.string().trim().url().optional(),
});

export type AdminSettingsWrite = z.infer<typeof adminSettingsWriteSchema>;

export const storefrontConfigSchema = z.object({
  freeShippingThreshold: z.number().int(),
  shippingZones: z.array(shippingZoneSchema),
});

export type StorefrontConfigDTO = z.infer<typeof storefrontConfigSchema>;
