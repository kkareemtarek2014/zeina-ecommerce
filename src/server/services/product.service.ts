import 'server-only';
import type { CategoryDTO, ProductDTO } from '@/shared/contracts/product.contract';
import { isFeatureEnabled } from '@/config/features.config';
import { getRequestDb } from '@/server/db/request';
import { NotFoundError } from '@/server/http/errors';
import * as categoriesRepo from '@/server/repositories/categories.repo';
import * as governoratesRepo from '@/server/repositories/governorates.repo';
import * as productsRepo from '@/server/repositories/products.repo';
import type { ProductRow } from '@/server/repositories/products.repo';
import { isEffectivelyInStock } from '@/server/lib/stock';
import {
  computeSellPrice,
  getPricingSettings,
  pricingInputFromRow,
  type PricingSettings,
} from '@/server/services/pricing.service';
import {
  DEFAULT_SHIPPING_ETA_DROPSHIP,
  DEFAULT_SHIPPING_ETA_LOCAL,
  resolveShippingEta,
} from '@/server/services/merchandising.service';
import type { Db } from '@/server/db/client';

type EtaLabels = { local: string; dropship: string };

/** Maps a DB row → public ProductDTO. Never exposes basePrice / USD / landed. */
export function toProductDTO(
  row: ProductRow,
  pricing: PricingSettings,
  etaLabels: EtaLabels = {
    local: DEFAULT_SHIPPING_ETA_LOCAL,
    dropship: DEFAULT_SHIPPING_ETA_DROPSHIP,
  },
): ProductDTO {
  const inStock = isEffectivelyInStock(row);
  const preordersOn = isFeatureEnabled('preorders');
  const preorderAvailable =
    preordersOn && row.preorderEnabled && !inStock;

  const dto: ProductDTO = {
    id: row.id,
    name: row.name,
    category: row.categorySlug,
    price: computeSellPrice(pricingInputFromRow(row), pricing),
    description: row.description,
    images: row.images,
    rating: row.rating,
    reviewCount: row.reviewCount,
    inStock,
  };
  if (row.compareAtPrice != null) dto.compareAtPrice = row.compareAtPrice;
  if (row.featured) dto.featured = true;
  if (row.tags?.length) dto.tags = row.tags;
  if (row.descriptionFormat === 'html') dto.descriptionFormat = 'html';
  dto.fulfilmentType = row.fulfilmentType ?? 'local_stock';
  if (preorderAvailable) {
    dto.preorderAvailable = true;
    if (row.preorderEtaDays != null) dto.preorderEtaDays = row.preorderEtaDays;
  }

  if (preorderAvailable && row.preorderEtaDays != null && row.preorderEtaDays > 0) {
    dto.shippingEta = `Ships in about ${row.preorderEtaDays} days (pre-order)`;
  } else if (dto.fulfilmentType === 'dropship') {
    dto.shippingEta = etaLabels.dropship;
  } else {
    dto.shippingEta = etaLabels.local;
  }

  return dto;
}

async function loadEtaLabels(db: Db): Promise<EtaLabels> {
  const local = await resolveShippingEta(db, {
    fulfilmentType: 'local_stock',
    inStock: true,
  });
  const dropship = await resolveShippingEta(db, {
    fulfilmentType: 'dropship',
    inStock: true,
  });
  return { local, dropship };
}

function toCategoryDTO(row: categoriesRepo.CategoryRow): CategoryDTO {
  return {
    slug: row.slug,
    name: row.name,
    image: row.image,
    seoDescription: row.seoDescription,
  };
}

export type ListProductsInput = {
  category?: string;
  featured?: boolean;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  q?: string;
};

export async function listProducts(
  input: ListProductsInput = {},
): Promise<ProductDTO[]> {
  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);
  const etaLabels = await loadEtaLabels(db);
  const rows = await productsRepo.findProducts(db, {
    category: input.category,
    featured: input.featured,
    sort: input.sort,
    q: input.q,
  });
  let dtos = rows.map((r) => toProductDTO(r, pricing, etaLabels));

  if (input.q?.trim() && !input.sort) {
    dtos = dtos.slice(0, 8);
  }
  return dtos;
}

export async function getProduct(id: string): Promise<ProductDTO> {
  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);
  const etaLabels = await loadEtaLabels(db);
  const row = await productsRepo.findProductById(db, id);
  if (!row) throw new NotFoundError('Product not found');
  return toProductDTO(row, pricing, etaLabels);
}

export async function getProductOrNull(id: string): Promise<ProductDTO | null> {
  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);
  const etaLabels = await loadEtaLabels(db);
  const row = await productsRepo.findProductById(db, id);
  return row ? toProductDTO(row, pricing, etaLabels) : null;
}

/**
 * Public catalog cards for an ordered list of IDs (published only).
 * Shared by the bundles marketing surface and any future ID-based grids.
 */
export async function listPublishedProductsByIds(
  ids: string[],
  limit = 24,
): Promise<ProductDTO[]> {
  const unique = [...new Set(ids)].slice(0, limit);
  if (!unique.length) return [];
  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);
  const etaLabels = await loadEtaLabels(db);
  const out: ProductDTO[] = [];
  for (const id of unique) {
    const row = await productsRepo.findProductById(db, id);
    if (!row || row.status !== 'published') continue;
    out.push(toProductDTO(row, pricing, etaLabels));
  }
  return out;
}

/** Server-only product + SEO fields for `generateMetadata` (not on public ProductDTO). */
export type ProductMetadataSource = ProductDTO & {
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  slug: string | null;
};

export async function getProductMetadataSource(
  id: string,
): Promise<ProductMetadataSource | null> {
  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);
  const etaLabels = await loadEtaLabels(db);
  const row = await productsRepo.findProductById(db, id);
  if (!row) return null;
  return {
    ...toProductDTO(row, pricing, etaLabels),
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogImage: row.ogImage,
    canonicalUrl: row.canonicalUrl,
    slug: row.slug,
  };
}

export async function getRelated(
  id: string,
  limit = 4,
): Promise<ProductDTO[]> {
  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);
  const etaLabels = await loadEtaLabels(db);
  const row = await productsRepo.findProductById(db, id);
  if (!row) throw new NotFoundError('Product not found');
  const related = await productsRepo.findRelatedProducts(
    db,
    id,
    row.categorySlug,
    limit,
  );
  return related.map((r) => toProductDTO(r, pricing, etaLabels));
}

export async function getNewArrivals(limit = 8): Promise<ProductDTO[]> {
  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);
  const etaLabels = await loadEtaLabels(db);
  const rows = await productsRepo.findNewArrivals(db, limit);
  return rows.map((r) => toProductDTO(r, pricing, etaLabels));
}

export async function searchProducts(query: string): Promise<ProductDTO[]> {
  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);
  const etaLabels = await loadEtaLabels(db);
  const rows = await productsRepo.searchProducts(db, query, 8);
  return rows.map((r) => toProductDTO(r, pricing, etaLabels));
}

export async function listCategories(): Promise<CategoryDTO[]> {
  const db = await getRequestDb();
  const rows = await categoriesRepo.findAllCategories(db);
  return rows.map(toCategoryDTO);
}

export async function getCategoryOrNull(
  slug: string,
): Promise<CategoryDTO | null> {
  const db = await getRequestDb();
  const row = await categoriesRepo.findCategoryBySlug(db, slug);
  return row ? toCategoryDTO(row) : null;
}

export async function listGovernorates() {
  const db = await getRequestDb();
  return governoratesRepo.findAllGovernorates(db);
}
