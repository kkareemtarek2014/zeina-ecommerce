import { withHandler } from '@/server/http/handler';
import { listStorefrontBundleProducts } from '@/server/services/bundle.service';
import { isFeatureEnabled } from '@/config/features.config';
import { NotFoundError } from '@/server/http/errors';

/** GET — products in active bundles (flag-gated). */
export const GET = withHandler(async () => {
  if (!isFeatureEnabled('bundles')) {
    throw new NotFoundError('Bundles are not enabled');
  }
  return listStorefrontBundleProducts();
});
