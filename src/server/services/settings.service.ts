import 'server-only';
import {
  adminSettingsWriteSchema,
  type AdminSettingsDTO,
  type StorefrontConfigDTO,
} from '@/shared/contracts/admin-config.contract';
import {
  FREE_SHIPPING_THRESHOLD,
  PROFIT_MARGIN,
  SITE,
} from '@/config/site.config';
import { getRequestDb } from '@/server/db/request';
import { ValidationError } from '@/server/http/errors';
import { eq } from 'drizzle-orm';
import { settings, shippingZones } from '@/server/db/schema';
import { asc } from 'drizzle-orm';

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

export async function getAdminSettings(): Promise<AdminSettingsDTO> {
  const [
    profitMargin,
    freeShippingThreshold,
    lowStockThreshold,
    siteName,
    siteTagline,
    siteUrl,
  ] = await Promise.all([
    getSettingValue('profit_margin'),
    getSettingValue('free_shipping_threshold'),
    getSettingValue('low_stock_threshold'),
    getSettingValue('site_name'),
    getSettingValue('site_tagline'),
    getSettingValue('site_url'),
  ]);

  return {
    profitMargin:
      typeof profitMargin === 'number' ? profitMargin : PROFIT_MARGIN,
    freeShippingThreshold:
      typeof freeShippingThreshold === 'number'
        ? freeShippingThreshold
        : FREE_SHIPPING_THRESHOLD,
    lowStockThreshold:
      typeof lowStockThreshold === 'number' ? lowStockThreshold : 5,
    siteName: typeof siteName === 'string' ? siteName : SITE.name,
    siteTagline: typeof siteTagline === 'string' ? siteTagline : SITE.tagline,
    siteUrl: typeof siteUrl === 'string' ? siteUrl : SITE.url,
  };
}

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

  if (data.profitMargin !== undefined) {
    await setSetting('profit_margin', data.profitMargin);
  }
  if (data.freeShippingThreshold !== undefined) {
    await setSetting('free_shipping_threshold', data.freeShippingThreshold);
  }
  if (data.lowStockThreshold !== undefined) {
    await setSetting('low_stock_threshold', data.lowStockThreshold);
  }
  if (data.siteName !== undefined) {
    await setSetting('site_name', data.siteName);
  }
  if (data.siteTagline !== undefined) {
    await setSetting('site_tagline', data.siteTagline);
  }
  if (data.siteUrl !== undefined) {
    await setSetting('site_url', data.siteUrl);
  }

  return getAdminSettings();
}

export async function getStorefrontConfig(): Promise<StorefrontConfigDTO> {
  const db = await getRequestDb();
  const thresholdRaw = await getSettingValue('free_shipping_threshold');
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
  };
}
