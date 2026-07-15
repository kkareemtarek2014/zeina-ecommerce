import { isFeatureEnabled } from '@/config/features.config';
import { CATEGORIES } from '@/shared/data/categories.data';
import { ClassicHome, HomeFromBlocks } from '@/features/homepage';
import { listCategories } from '@/server/services/product.service';
import { getBridalPageConfig } from '@/server/services/settings.service';
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

  let bridalPage = true;
  let bridalSpotlight = true;
  try {
    const bridal = await getBridalPageConfig();
    bridalPage = bridal.enabled;
    bridalSpotlight = bridal.enabled && bridal.homeSpotlight;
  } catch {
    // Build/preview without bindings — default to visible.
  }

  return (
    <ClassicHome
      categories={categories}
      bridalPage={bridalPage}
      bridalSpotlight={bridalSpotlight}
    />
  );
}
