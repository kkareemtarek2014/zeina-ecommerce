import 'server-only';
import { eq } from 'drizzle-orm';
import { temuImportWriteSchema } from '@/shared/contracts/admin-temu.contract';
import type { AdminProductDTO } from '@/shared/contracts/admin-catalog.contract';
import { products } from '@/server/db/schema';
import { getCloudflareEnv, getRequestDb } from '@/server/db/request';
import {
  ConflictError,
  ValidationError,
} from '@/server/http/errors';
import * as categoriesRepo from '@/server/repositories/categories.repo';
import * as mediaRepo from '@/server/repositories/media.repo';
import * as productsRepo from '@/server/repositories/products.repo';
import {
  computeLandedCost,
  getPricingSettings,
} from '@/server/services/pricing.service';
import { resolveTemuProvider } from '@/server/services/temu-scraper.provider';
import { putRemoteCatalogImage } from '@/server/services/upload.service';
import { prepareProductDescription } from '@/server/lib/sanitize-html';
import { getAdminProduct } from '@/server/services/admin-catalog.service';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

/**
 * Paste Temu URL → draft product (never auto-publish). Images → R2.
 */
export async function importTemuProduct(
  raw: unknown,
  actorId: string,
): Promise<AdminProductDTO> {
  const parsed = temuImportWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const env = await getCloudflareEnv();
  const provider = resolveTemuProvider(env);
  let normalized;
  try {
    normalized = await provider.fetchProduct(parsed.data.url);
  } catch (err) {
    throw new ValidationError(
      err instanceof Error
        ? `Scraper failed: ${err.message}`
        : 'Scraper failed to fetch product',
    );
  }

  const db = await getRequestDb();
  const prior = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sourceProductId, normalized.sourceProductId))
    .limit(1);
  if (prior[0]) {
    throw new ConflictError(
      `Product already imported from this Temu id (${prior[0].id})`,
    );
  }

  const allCats = await categoriesRepo.findAllCategories(db);
  const categorySlug =
    parsed.data.categorySlug ??
    allCats.find((c) => c.slug === 'medium')?.slug ??
    allCats[0]?.slug;
  if (!categorySlug) {
    throw new ValidationError('No categories available — create one first');
  }
  const cat = await categoriesRepo.findCategoryBySlug(db, categorySlug);
  if (!cat) throw new ValidationError('Invalid category');

  const id = `p-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  const slug = `${slugify(normalized.title)}-${id.slice(2, 6)}`;
  const sku = `SQ-${id.toUpperCase()}`;

  const imageUrls: string[] = [];
  for (const remote of normalized.imageUrls.slice(0, 6)) {
    try {
      if (remote.startsWith('/images/')) {
        imageUrls.push(remote);
        continue;
      }
      const uploaded = await putRemoteCatalogImage(`products/${id}`, remote);
      imageUrls.push(uploaded.url);
      await mediaRepo.insertMedia(db, {
        id: `med_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
        r2Key: uploaded.key,
        url: uploaded.url,
        filename: remote.split('/').pop()?.slice(0, 120) || 'temu.jpg',
        mime: uploaded.mime,
        size: uploaded.size,
        width: null,
        height: null,
        alt: normalized.title,
        folder: 'temu-import',
        uploadedBy: actorId,
        createdAt: new Date(),
      });
    } catch (err) {
      console.warn('[temu-import] image skip', remote, err);
    }
  }

  const pricing = await getPricingSettings(db);
  const basePriceUsd = normalized.basePriceUsd;
  const landedCost = computeLandedCost(basePriceUsd, pricing);
  const basePrice = Math.max(1, landedCost);
  const desc = prepareProductDescription(normalized.descriptionHtml, 'html');
  const fulfilmentType = parsed.data.fulfilmentType ?? 'local_stock';
  const now = new Date();

  await productsRepo.insertProduct(db, {
    id,
    name: normalized.title.slice(0, 200),
    categorySlug,
    basePrice,
    compareAtPrice: null,
    description: desc.description,
    descriptionFormat: desc.descriptionFormat,
    images: imageUrls,
    rating: 0,
    reviewCount: 0,
    inStock: false,
    featured: false,
    tags: ['temu-import'],
    createdAt: now,
    slug,
    sku,
    status: 'draft',
    stockQty: 0,
    reservedQty: 0,
    seoTitle: null,
    seoDescription: null,
    ogImage: imageUrls[0] ?? null,
    canonicalUrl: null,
    archivedAt: null,
    basePriceUsd,
    landedCost,
    sourceProvider: 'temu',
    sourceUrl: normalized.sourceUrl,
    sourceProductId: normalized.sourceProductId,
    sourceVariantMap: normalized.variants,
    sourceInStock: normalized.inStock,
    lastSyncedAt: now,
    fulfilmentType,
  });

  return getAdminProduct(id);
}
