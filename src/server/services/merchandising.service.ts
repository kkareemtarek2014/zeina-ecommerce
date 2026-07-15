import 'server-only';
import { eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { settings } from '@/server/db/schema';
import { isFeatureEnabled } from '@/config/features.config';
import { isHttpsUrl } from '@/shared/lib/contact-links';

export const DEFAULT_SHIPPING_ETA_LOCAL = '1–2 days';
export const DEFAULT_SHIPPING_ETA_DROPSHIP = '2–3 weeks';

async function readSettingString(
  db: Db,
  key: string,
  fallback: string,
): Promise<string> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  const value = rows[0]?.value;
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export type ShippingEtaInput = {
  fulfilmentType: 'local_stock' | 'dropship';
  preorderEnabled?: boolean;
  preorderEtaDays?: number | null;
  inStock: boolean;
};

export async function resolveShippingEta(
  db: Db,
  input: ShippingEtaInput,
): Promise<string> {
  const preordersOn = isFeatureEnabled('preorders');
  if (
    preordersOn &&
    input.preorderEnabled &&
    !input.inStock &&
    input.preorderEtaDays != null &&
    input.preorderEtaDays > 0
  ) {
    return `Ships in about ${input.preorderEtaDays} days (pre-order)`;
  }

  if (input.fulfilmentType === 'dropship') {
    return readSettingString(
      db,
      'shipping_eta_dropship',
      DEFAULT_SHIPPING_ETA_DROPSHIP,
    );
  }
  return readSettingString(db, 'shipping_eta_local', DEFAULT_SHIPPING_ETA_LOCAL);
}

export type SocialProofDTO = {
  handle: string | null;
  postUrls: string[];
};

export async function getSocialProof(db: Db): Promise<SocialProofDTO | null> {
  if (!isFeatureEnabled('social_proof')) return null;

  const [handleRaw, postsRaw, socialIg] = await Promise.all([
    db.select().from(settings).where(eq(settings.key, 'instagram_handle')).limit(1),
    db
      .select()
      .from(settings)
      .where(eq(settings.key, 'instagram_post_urls'))
      .limit(1),
    db
      .select()
      .from(settings)
      .where(eq(settings.key, 'social_instagram'))
      .limit(1),
  ]);

  const handleFromSetting =
    typeof handleRaw[0]?.value === 'string' ? handleRaw[0].value.trim() : '';
  const handleFromSocial =
    typeof socialIg[0]?.value === 'string' ? socialIg[0].value.trim() : '';
  const handle = handleFromSetting || handleFromSocial || null;

  let postUrls: string[] = [];
  const postsVal = postsRaw[0]?.value;
  if (Array.isArray(postsVal)) {
    postUrls = postsVal.filter(
      (u): u is string => typeof u === 'string' && isHttpsUrl(u),
    );
  }

  if (!handle && postUrls.length === 0) return null;
  return { handle, postUrls: postUrls.slice(0, 6) };
}
