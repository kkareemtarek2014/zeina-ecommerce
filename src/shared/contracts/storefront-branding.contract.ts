import { z } from 'zod';

/**
 * Public storefront branding + announcement DTOs.
 * Pricing and admin-only settings intentionally do not live here.
 */

const announcementHrefSchema = z
  .string()
  .trim()
  .min(1)
  .superRefine((href, ctx) => {
    if (href.startsWith('/')) {
      if (href.startsWith('//')) {
        ctx.addIssue({
          code: 'custom',
          message: 'Protocol-relative URLs are not allowed',
        });
      }
      return;
    }
    try {
      const url = new URL(href);
      if (url.protocol !== 'https:') {
        ctx.addIssue({
          code: 'custom',
          message: 'External announcement links must use https',
        });
      }
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'Announcement href must be an internal path or https URL',
      });
    }
  });

export const announcementItemSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1).max(80),
  href: announcementHrefSchema.optional(),
  active: z.boolean(),
  sortOrder: z.number().int(),
});

export type AnnouncementItem = z.infer<typeof announcementItemSchema>;

export const AnnouncementItemsSchema = z
  .array(announcementItemSchema)
  .superRefine((items, ctx) => {
    const ids = new Set<string>();
    for (let i = 0; i < items.length; i += 1) {
      const id = items[i]?.id;
      if (!id) continue;
      if (ids.has(id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate announcement id: ${id}`,
          path: [i, 'id'],
        });
      }
      ids.add(id);
    }
    const activeCount = items.filter((item) => item.active).length;
    if (activeCount > 5) {
      ctx.addIssue({
        code: 'custom',
        message: 'At most 5 announcements can be active',
        path: ['active'],
      });
    }
  });

export type AnnouncementItems = z.infer<typeof AnnouncementItemsSchema>;

export const siteBrandingDtoSchema = z.object({
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
  footerText: z.string().nullable(),
  seoDefaultTitle: z.string().nullable(),
  seoDefaultDescription: z.string().nullable(),
  announcements: z.array(announcementItemSchema),
});

export type SiteBrandingDTO = z.infer<typeof siteBrandingDtoSchema>;
