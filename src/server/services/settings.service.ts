import 'server-only';
import {
  adminSettingsWriteSchema,
  type AdminSettingsDTO,
  type AdminSettingsWrite,
  type StorefrontConfigDTO,
} from '@/shared/contracts/admin-config.contract';
import {
  FREE_SHIPPING_THRESHOLD,
  PROFIT_MARGIN,
  SITE,
} from '@/config/site.config';
import { isFeatureEnabled } from '@/config/features.config';
import { getRequestDb } from '@/server/db/request';
import { ValidationError } from '@/server/http/errors';
import { eq, asc } from 'drizzle-orm';
import { settings, shippingZones } from '@/server/db/schema';
import {
  DEFAULT_BULK_SHIPPING_USD,
  DEFAULT_CUSTOMS_DUTY_RATE,
  DEFAULT_HANDLING_FEE_EGP,
  DEFAULT_PRICE_ROUNDING_EGP,
  DEFAULT_TARGET_MARGIN,
  DEFAULT_USD_EGP_RATE,
  DEFAULT_VAT_RATE,
  repriceProductsWithUsdBase,
} from '@/server/services/pricing.service';
import {
  DEFAULT_SHIPPING_ETA_DROPSHIP,
  DEFAULT_SHIPPING_ETA_LOCAL,
} from '@/server/services/merchandising.service';
import { getOnlinePaymentsAvailability } from '@/server/services/paymob.service';

async function getSettingValue(
  key: string,
): Promise<unknown | undefined> {
  const db = await getRequestDb();
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return rows[0]?.value;
}

async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getRequestDb();
  const now = new Date();
  const existing = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  if (existing[0]) {
    await db
      .update(settings)
      .set({ value, updatedAt: now })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value, updatedAt: now });
  }
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export async function getAdminSettings(): Promise<AdminSettingsDTO> {
  const keys = [
    'profit_margin',
    'free_shipping_threshold',
    'low_stock_threshold',
    'usd_egp_rate',
    'bulk_shipping_usd',
    'customs_duty_rate',
    'vat_rate',
    'handling_fee_egp',
    'target_margin',
    'price_rounding_egp',
    'site_name',
    'site_tagline',
    'site_url',
    'logo_url',
    'favicon_url',
    'contact_email',
    'contact_phone',
    'whatsapp_number',
    'social_instagram',
    'social_facebook',
    'social_tiktok',
    'shipping_eta_local',
    'shipping_eta_dropship',
    'instagram_handle',
    'instagram_post_urls',
    'seo_default_title',
    'seo_default_description',
    'footer_text',
    'maintenance_mode',
    'bridal_page_enabled',
    'bridal_show_collections',
    'bridal_show_personalization',
    'bridal_show_tiers',
    'bridal_show_final_cta',
    'bridal_show_home_spotlight',
    'bridal_custom_enabled',
    'temu_scraper_enabled',
    'unpaid_order_timeout_minutes',
    'pending_reminder_hours',
    'cron_last_runs',
  ] as const;

  const values = await Promise.all(keys.map((k) => getSettingValue(k)));
  const map = Object.fromEntries(
    keys.map((k, i) => [k, values[i]]),
  ) as Record<(typeof keys)[number], unknown | undefined>;

  const cronLastRuns =
    map.cron_last_runs &&
    typeof map.cron_last_runs === 'object' &&
    !Array.isArray(map.cron_last_runs)
      ? (map.cron_last_runs as Record<string, string>)
      : undefined;

  return {
    profitMargin:
      typeof map.profit_margin === 'number' ? map.profit_margin : PROFIT_MARGIN,
    freeShippingThreshold:
      typeof map.free_shipping_threshold === 'number'
        ? map.free_shipping_threshold
        : FREE_SHIPPING_THRESHOLD,
    lowStockThreshold:
      typeof map.low_stock_threshold === 'number'
        ? map.low_stock_threshold
        : 5,
    dynamicPricingEnabled: isFeatureEnabled('dynamic_pricing'),
    usdEgpRate: asNumber(map.usd_egp_rate, DEFAULT_USD_EGP_RATE),
    bulkShippingUsd: asNumber(map.bulk_shipping_usd, DEFAULT_BULK_SHIPPING_USD),
    customsDutyRate: asNumber(
      map.customs_duty_rate,
      DEFAULT_CUSTOMS_DUTY_RATE,
    ),
    vatRate: asNumber(map.vat_rate, DEFAULT_VAT_RATE),
    handlingFeeEgp: Math.round(
      asNumber(map.handling_fee_egp, DEFAULT_HANDLING_FEE_EGP),
    ),
    targetMargin: asNumber(map.target_margin, DEFAULT_TARGET_MARGIN),
    priceRoundingEgp: Math.round(
      asNumber(map.price_rounding_egp, DEFAULT_PRICE_ROUNDING_EGP),
    ),
    siteName:
      typeof map.site_name === 'string' ? map.site_name : SITE.name,
    siteTagline:
      typeof map.site_tagline === 'string' ? map.site_tagline : SITE.tagline,
    siteUrl: typeof map.site_url === 'string' ? map.site_url : SITE.url,
    logoUrl: asString(map.logo_url),
    faviconUrl: asString(map.favicon_url),
    contactEmail: asString(map.contact_email),
    contactPhone: asString(map.contact_phone),
    whatsappNumber: asString(map.whatsapp_number),
    socialInstagram: asString(map.social_instagram),
    socialFacebook: asString(map.social_facebook),
    socialTiktok: asString(map.social_tiktok),
    shippingEtaLocal:
      typeof map.shipping_eta_local === 'string' && map.shipping_eta_local.trim()
        ? map.shipping_eta_local.trim()
        : DEFAULT_SHIPPING_ETA_LOCAL,
    shippingEtaDropship:
      typeof map.shipping_eta_dropship === 'string' &&
      map.shipping_eta_dropship.trim()
        ? map.shipping_eta_dropship.trim()
        : DEFAULT_SHIPPING_ETA_DROPSHIP,
    instagramHandle: asString(map.instagram_handle),
    instagramPostUrls: Array.isArray(map.instagram_post_urls)
      ? map.instagram_post_urls.filter(
          (u): u is string => typeof u === 'string' && /^https?:\/\//.test(u),
        )
      : [],
    seoDefaultTitle: asString(map.seo_default_title),
    seoDefaultDescription: asString(map.seo_default_description),
    footerText: asString(map.footer_text),
    maintenanceMode: asBool(map.maintenance_mode, false),
    // Default ON — bridal landing page is visible until an admin hides it
    bridalPageEnabled: asBool(map.bridal_page_enabled, true),
    bridalShowCollections: asBool(map.bridal_show_collections, true),
    bridalShowPersonalization: asBool(map.bridal_show_personalization, true),
    bridalShowTiers: asBool(map.bridal_show_tiers, true),
    bridalShowFinalCta: asBool(map.bridal_show_final_cta, true),
    bridalShowHomeSpotlight: asBool(map.bridal_show_home_spotlight, true),
    bridalCustomEnabled: asBool(map.bridal_custom_enabled, true),
    // Default ON so import/sync work until an admin flips the kill switch
    temuScraperEnabled: asBool(map.temu_scraper_enabled, true),
    unpaidOrderTimeoutMinutes:
      typeof map.unpaid_order_timeout_minutes === 'number' &&
      map.unpaid_order_timeout_minutes > 0
        ? Math.floor(map.unpaid_order_timeout_minutes)
        : 60,
    pendingReminderHours:
      typeof map.pending_reminder_hours === 'number' &&
      map.pending_reminder_hours > 0
        ? Math.floor(map.pending_reminder_hours)
        : 48,
    ...(cronLastRuns ? { cronLastRuns } : {}),
  };
}

const WRITE_KEYS: { field: keyof AdminSettingsWrite; key: string }[] = [
  { field: 'profitMargin', key: 'profit_margin' },
  { field: 'freeShippingThreshold', key: 'free_shipping_threshold' },
  { field: 'lowStockThreshold', key: 'low_stock_threshold' },
  { field: 'usdEgpRate', key: 'usd_egp_rate' },
  { field: 'bulkShippingUsd', key: 'bulk_shipping_usd' },
  { field: 'customsDutyRate', key: 'customs_duty_rate' },
  { field: 'vatRate', key: 'vat_rate' },
  { field: 'handlingFeeEgp', key: 'handling_fee_egp' },
  { field: 'targetMargin', key: 'target_margin' },
  { field: 'priceRoundingEgp', key: 'price_rounding_egp' },
  { field: 'siteName', key: 'site_name' },
  { field: 'siteTagline', key: 'site_tagline' },
  { field: 'siteUrl', key: 'site_url' },
  { field: 'logoUrl', key: 'logo_url' },
  { field: 'faviconUrl', key: 'favicon_url' },
  { field: 'contactEmail', key: 'contact_email' },
  { field: 'contactPhone', key: 'contact_phone' },
  { field: 'whatsappNumber', key: 'whatsapp_number' },
  { field: 'socialInstagram', key: 'social_instagram' },
  { field: 'socialFacebook', key: 'social_facebook' },
  { field: 'socialTiktok', key: 'social_tiktok' },
  { field: 'shippingEtaLocal', key: 'shipping_eta_local' },
  { field: 'shippingEtaDropship', key: 'shipping_eta_dropship' },
  { field: 'instagramHandle', key: 'instagram_handle' },
  { field: 'instagramPostUrls', key: 'instagram_post_urls' },
  { field: 'seoDefaultTitle', key: 'seo_default_title' },
  { field: 'seoDefaultDescription', key: 'seo_default_description' },
  { field: 'footerText', key: 'footer_text' },
  { field: 'maintenanceMode', key: 'maintenance_mode' },
  { field: 'bridalPageEnabled', key: 'bridal_page_enabled' },
  { field: 'bridalShowCollections', key: 'bridal_show_collections' },
  { field: 'bridalShowPersonalization', key: 'bridal_show_personalization' },
  { field: 'bridalShowTiers', key: 'bridal_show_tiers' },
  { field: 'bridalShowFinalCta', key: 'bridal_show_final_cta' },
  { field: 'bridalShowHomeSpotlight', key: 'bridal_show_home_spotlight' },
  { field: 'bridalCustomEnabled', key: 'bridal_custom_enabled' },
  { field: 'temuScraperEnabled', key: 'temu_scraper_enabled' },
  { field: 'unpaidOrderTimeoutMinutes', key: 'unpaid_order_timeout_minutes' },
  { field: 'pendingReminderHours', key: 'pending_reminder_hours' },
];

const REPRICE_FIELDS: (keyof AdminSettingsWrite)[] = [
  'usdEgpRate',
  'bulkShippingUsd',
  'customsDutyRate',
  'vatRate',
  'handlingFeeEgp',
  'targetMargin',
  'priceRoundingEgp',
];

export async function updateAdminSettings(
  raw: unknown,
): Promise<AdminSettingsDTO> {
  const parsed = adminSettingsWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    throw new ValidationError('No fields to update');
  }

  for (const { field, key } of WRITE_KEYS) {
    if (data[field] !== undefined) {
      await setSetting(key, data[field] as unknown);
    }
  }

  const shouldReprice = REPRICE_FIELDS.some((f) => data[f] !== undefined);
  if (shouldReprice) {
    const db = await getRequestDb();
    await repriceProductsWithUsdBase(db);
  }

  return getAdminSettings();
}

export async function getStorefrontConfig(): Promise<StorefrontConfigDTO> {
  const db = await getRequestDb();
  const thresholdRaw = await getSettingValue('free_shipping_threshold');
  const maintenanceRaw = await getSettingValue('maintenance_mode');
  const zones = await db
    .select()
    .from(shippingZones)
    .orderBy(asc(shippingZones.zone));

  return {
    freeShippingThreshold:
      typeof thresholdRaw === 'number'
        ? thresholdRaw
        : FREE_SHIPPING_THRESHOLD,
    shippingZones: zones.map((z) => ({
      zone: z.zone,
      label: z.label,
      fee: z.fee,
    })),
    maintenanceMode: asBool(maintenanceRaw, false),
    onlinePayments: await getOnlinePaymentsAvailability(),
    bridalPage: await isBridalPageEnabled(),
  };
}

/** Bridal landing page visibility (admin toggle; default visible). */
export async function isBridalPageEnabled(): Promise<boolean> {
  const raw = await getSettingValue('bridal_page_enabled');
  return asBool(raw, true);
}

export type BridalPageConfig = {
  /** Master toggle — off → /bride and /bride/custom show coming soon. */
  enabled: boolean;
  collections: boolean;
  personalization: boolean;
  tiers: boolean;
  finalCta: boolean;
  homeSpotlight: boolean;
  /** Custom-request funnel: /bride/custom page + custom CTAs. */
  customRequests: boolean;
};

/** All bridal storefront toggles in one read (admin-editable, default ON). */
export async function getBridalPageConfig(): Promise<BridalPageConfig> {
  const [
    enabled,
    collections,
    personalization,
    tiers,
    finalCta,
    homeSpotlight,
    customRequests,
  ] = await Promise.all([
    getSettingValue('bridal_page_enabled'),
    getSettingValue('bridal_show_collections'),
    getSettingValue('bridal_show_personalization'),
    getSettingValue('bridal_show_tiers'),
    getSettingValue('bridal_show_final_cta'),
    getSettingValue('bridal_show_home_spotlight'),
    getSettingValue('bridal_custom_enabled'),
  ]);
  return {
    enabled: asBool(enabled, true),
    collections: asBool(collections, true),
    personalization: asBool(personalization, true),
    tiers: asBool(tiers, true),
    finalCta: asBool(finalCta, true),
    homeSpotlight: asBool(homeSpotlight, true),
    customRequests: asBool(customRequests, true),
  };
}

/** Lightweight check for Edge middleware / API. */
export async function isMaintenanceModeEnabled(): Promise<boolean> {
  const raw = await getSettingValue('maintenance_mode');
  return asBool(raw, false);
}

/** Temu import + stock sync kill switch (default enabled). */
export async function isTemuScraperEnabled(): Promise<boolean> {
  const raw = await getSettingValue('temu_scraper_enabled');
  return asBool(raw, true);
}
