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
  bostaCityId: z.string().trim().optional(),
  bostaZone: z.string().trim().optional(),
  bostaDistrict: z.string().trim().optional(),
});

export type AdminGovernorateWrite = z.infer<typeof adminGovernorateWriteSchema>;

export const adminGovernorateUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  zone: z.enum(['cairo_giza', 'near', 'far']).optional(),
  bostaCityId: z.string().trim().optional(),
  bostaZone: z.string().trim().optional(),
  bostaDistrict: z.string().trim().optional(),
});

export const adminShippingZoneFeeSchema = z.object({
  fee: z.number().int().min(0),
});

export const adminPromoDtoSchema = z.object({
  code: z.string(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number(),
  minOrderValue: z.number().int().optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  active: z.boolean(),
  timesUsed: z.number().int().optional(),
  remaining: z.number().int().nullable().optional(),
  discountTotal: z.number().int().optional(),
  revenueTotal: z.number().int().optional(),
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
    maxRedemptions: z.number().int().positive().optional().nullable(),
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
    maxRedemptions: z.number().int().positive().optional().nullable(),
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

export type AdminPromoUpdate = z.infer<typeof adminPromoUpdateSchema>;

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
  /** Read-only mirror of `dynamic_pricing` feature flag. */
  dynamicPricingEnabled: z.boolean(),
  usdEgpRate: z.number(),
  bulkShippingUsd: z.number(),
  customsDutyRate: z.number(),
  vatRate: z.number(),
  handlingFeeEgp: z.number().int(),
  targetMargin: z.number(),
  priceRoundingEgp: z.number().int(),
  siteName: z.string(),
  siteTagline: z.string(),
  siteUrl: z.string(),
  logoUrl: z.string().nullable(),
  faviconUrl: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  whatsappNumber: z.string().nullable(),
  socialInstagram: z.string().nullable(),
  socialFacebook: z.string().nullable(),
  socialTiktok: z.string().nullable(),
  shippingEtaLocal: z.string(),
  shippingEtaDropship: z.string(),
  instagramHandle: z.string().nullable(),
  instagramPostUrls: z.array(z.string()),
  seoDefaultTitle: z.string().nullable(),
  seoDefaultDescription: z.string().nullable(),
  footerText: z.string().nullable(),
  maintenanceMode: z.boolean(),
  /** Show/hide the /bride landing page (dashboard toggle). Hidden → coming soon. */
  bridalPageEnabled: z.boolean(),
  /** Per-section bridal toggles (all default ON). */
  bridalShowCollections: z.boolean(),
  bridalShowPersonalization: z.boolean(),
  bridalShowTiers: z.boolean(),
  bridalShowFinalCta: z.boolean(),
  bridalShowHomeSpotlight: z.boolean(),
  /** Custom-request funnel: /bride/custom + all "custom piece" CTAs. */
  bridalCustomEnabled: z.boolean(),
  /** Kill switch for Temu import + stock sync (dashboard toggle). */
  temuScraperEnabled: z.boolean(),
  unpaidOrderTimeoutMinutes: z.number().int(),
  pendingReminderHours: z.number().int(),
  cronLastRuns: z.record(z.string(), z.string()).optional(),
});

export type AdminSettingsDTO = z.infer<typeof adminSettingsDtoSchema>;

export const adminSettingsWriteSchema = z.object({
  profitMargin: z.number().min(0.2).max(0.3).optional(),
  freeShippingThreshold: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  usdEgpRate: z.number().positive().optional(),
  bulkShippingUsd: z.number().min(0).optional(),
  customsDutyRate: z.number().min(0).max(1).optional(),
  vatRate: z.number().min(0).max(1).optional(),
  handlingFeeEgp: z.number().int().min(0).optional(),
  targetMargin: z.number().min(0).max(2).optional(),
  priceRoundingEgp: z.number().int().min(1).max(100).optional(),
  siteName: z.string().trim().min(1).optional(),
  siteTagline: z.string().trim().min(1).optional(),
  siteUrl: z.string().trim().url().optional(),
  logoUrl: z.string().trim().min(1).nullable().optional(),
  faviconUrl: z.string().trim().min(1).nullable().optional(),
  contactEmail: z.string().trim().email().nullable().optional(),
  contactPhone: z.string().trim().nullable().optional(),
  whatsappNumber: z.string().trim().nullable().optional(),
  socialInstagram: z.string().trim().nullable().optional(),
  socialFacebook: z.string().trim().nullable().optional(),
  socialTiktok: z.string().trim().nullable().optional(),
  shippingEtaLocal: z.string().trim().min(1).max(80).optional(),
  shippingEtaDropship: z.string().trim().min(1).max(80).optional(),
  instagramHandle: z.string().trim().nullable().optional(),
  instagramPostUrls: z.array(z.string().url()).max(12).optional(),
  seoDefaultTitle: z.string().trim().nullable().optional(),
  seoDefaultDescription: z.string().trim().nullable().optional(),
  footerText: z.string().trim().nullable().optional(),
  maintenanceMode: z.boolean().optional(),
  bridalPageEnabled: z.boolean().optional(),
  bridalShowCollections: z.boolean().optional(),
  bridalShowPersonalization: z.boolean().optional(),
  bridalShowTiers: z.boolean().optional(),
  bridalShowFinalCta: z.boolean().optional(),
  bridalShowHomeSpotlight: z.boolean().optional(),
  bridalCustomEnabled: z.boolean().optional(),
  temuScraperEnabled: z.boolean().optional(),
  unpaidOrderTimeoutMinutes: z.number().int().min(5).max(7 * 24 * 60).optional(),
  pendingReminderHours: z.number().int().min(1).max(30 * 24).optional(),
});

export type AdminSettingsWrite = z.infer<typeof adminSettingsWriteSchema>;

export const storefrontConfigSchema = z.object({
  freeShippingThreshold: z.number().int(),
  shippingZones: z.array(shippingZoneSchema),
  maintenanceMode: z.boolean(),
  /** Paymob card/wallet available (flag + secrets). */
  onlinePayments: z.boolean().optional(),
  /** Bridal landing page visible (admin toggle). */
  bridalPage: z.boolean().optional(),
});

export type StorefrontConfigDTO = z.infer<typeof storefrontConfigSchema>;
