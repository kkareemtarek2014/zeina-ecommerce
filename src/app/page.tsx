import { FREE_SHIPPING_THRESHOLD } from '@/config/site.config';
import { isFeatureEnabled } from '@/config/features.config';
import { CATEGORIES } from '@/shared/data/categories.data';
import { ClassicHome, HomeFromBlocks } from '@/features/homepage';
import {
  getCategoryMinPrices,
  getSiteRatingSummary,
  listCategories,
} from '@/server/services/product.service';
import {
  getHomepageBundleSpotlight,
  type BundleSpotlightDTO,
} from '@/server/services/bundle.service';
import { getSiteBranding, getStorefrontConfig } from '@/server/services/settings.service';
import { normalizeWhatsAppDigits } from '@/shared/lib/contact-links';
import { listActiveHomepageBlocks } from '@/server/services/admin-homepage.service';
import type { HomepageBlockDTO } from '@/shared/contracts/homepage.contract';
import type { Category } from '@/shared/types/product.types';

export default async function HomePage() {
  let categories: Category[] = CATEGORIES;
  try {
    categories = await listCategories();
  } catch {
    // Build/preview without bindings — seed categories keep the home grid intact.
  }

  let blocks: HomepageBlockDTO[] = [];
  if (isFeatureEnabled('homepage_builder')) {
    try {
      blocks = await listActiveHomepageBlocks();
    } catch {
      // Fall through to classic home if D1 unavailable at build time.
    }
  }

  if (blocks.length > 0) {
    return <HomeFromBlocks blocks={blocks} />;
  }

  // Best-effort enrichment — each falls back gracefully so a D1 hiccup never
  // breaks the homepage (same pattern as the categories fetch above).
  let categoryMinPrices: Record<string, number> = {};
  let freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
  let bundleSpotlight: BundleSpotlightDTO | null = null;
  let rating = { average: 0, count: 0 };
  let whatsappDigits: string | null = null;

  try {
    [categoryMinPrices, freeShippingThreshold, bundleSpotlight, rating, whatsappDigits] =
      await Promise.all([
        getCategoryMinPrices(categories.map((c) => c.slug)),
        getStorefrontConfig().then((c) => c.freeShippingThreshold),
        getHomepageBundleSpotlight(),
        getSiteRatingSummary(),
        getSiteBranding().then((b) => normalizeWhatsAppDigits(b.whatsappNumber)),
      ]);
  } catch {
    // Build/preview without bindings — defaults above keep the page intact.
  }

  return (
    <ClassicHome
      categories={categories}
      categoryMinPrices={categoryMinPrices}
      freeShippingThreshold={freeShippingThreshold}
      bundleSpotlight={bundleSpotlight}
      rating={rating}
      whatsappDigits={whatsappDigits}
    />
  );
}
