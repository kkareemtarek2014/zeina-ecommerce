import { isFeatureEnabled } from '@/config/features.config';
import { CATEGORIES } from '@/shared/data/categories.data';
import { ClassicHome, HomeFromBlocks } from '@/features/homepage';
import { listCategories } from '@/server/services/product.service';
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

  return (
    <ClassicHome
      categories={categories}
    />
  );
}
