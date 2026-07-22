import 'server-only';
import {
  adminCategoryWriteSchema,
  adminProductBulkSchema,
  adminProductWriteSchema,
  type AdminCategoryDTO,
  type AdminCsvImportReport,
  type AdminProductBulkResult,
  type AdminProductDTO,
  type Paginated,
  type ProductStatus,
} from '@/shared/contracts/admin-catalog.contract';
import { getRequestDb } from '@/server/db/request';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as categoriesRepo from '@/server/repositories/categories.repo';
import * as inventoryRepo from '@/server/repositories/inventory.repo';
import * as productsRepo from '@/server/repositories/products.repo';
import {
  computeLandedCost,
  computeSellPrice,
  getPricingSettings,
  pricingInputFromRow,
  type PricingSettings,
} from '@/server/services/pricing.service';
import { getLowStockThreshold } from '@/server/services/inventory.service';
import {
  deleteUploadObject,
  mediaUrlToKey,
  uploadProcessedCatalogImage,
} from '@/server/services/upload.service';
import {
  availableQty,
  isEffectivelyInStock,
} from '@/server/lib/stock';
import { prepareProductDescription } from '@/server/lib/sanitize-html';
import type { ProductRow } from '@/server/repositories/products.repo';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toAdminProduct(
  row: ProductRow,
  pricing: PricingSettings,
): AdminProductDTO {
  const dto: AdminProductDTO = {
    id: row.id,
    name: row.name,
    category: row.categorySlug,
    basePrice: row.basePrice,
    price: computeSellPrice(pricingInputFromRow(row), pricing),
    description: row.description,
    images: row.images ?? [],
    rating: row.rating,
    reviewCount: row.reviewCount,
    inStock: isEffectivelyInStock(row),
    status: row.status,
    stockQty: row.stockQty,
    reservedQty: row.reservedQty,
    availableQty: availableQty(row),
    descriptionFormat: row.descriptionFormat,
    createdAt: row.createdAt.toISOString(),
  };
  if (row.compareAtPrice != null) dto.compareAtPrice = row.compareAtPrice;
  if (row.featured) dto.featured = true;
  if (row.tags?.length) dto.tags = row.tags;
  if (row.slug) dto.slug = row.slug;
  if (row.sku) dto.sku = row.sku;
  if (row.seoTitle) dto.seoTitle = row.seoTitle;
  if (row.seoDescription) dto.seoDescription = row.seoDescription;
  if (row.ogImage) dto.ogImage = row.ogImage;
  if (row.canonicalUrl) dto.canonicalUrl = row.canonicalUrl;
  if (row.basePriceUsd != null) dto.basePriceUsd = row.basePriceUsd;
  if (row.landedCost != null) dto.landedCost = row.landedCost;
  if (row.sourceProvider) dto.sourceProvider = row.sourceProvider;
  if (row.sourceUrl) dto.sourceUrl = row.sourceUrl;
  if (row.sourceProductId) dto.sourceProductId = row.sourceProductId;
  if (row.sourceInStock != null) dto.sourceInStock = row.sourceInStock;
  if (row.lastSyncedAt) dto.lastSyncedAt = row.lastSyncedAt.toISOString();
  dto.fulfilmentType = row.fulfilmentType ?? 'local_stock';
  dto.preorderEnabled = row.preorderEnabled ?? false;
  dto.preorderEtaDays = row.preorderEtaDays ?? null;
  dto.archivedAt = row.archivedAt ? row.archivedAt.toISOString() : null;
  return dto;
}

function toAdminCategory(
  row: categoriesRepo.CategoryRow,
): AdminCategoryDTO {
  return {
    slug: row.slug,
    name: row.name,
    image: row.image,
    seoDescription: row.seoDescription,
    sortOrder: row.sortOrder,
  };
}

async function assertUniqueSlugSku(
  db: Awaited<ReturnType<typeof getRequestDb>>,
  slug: string | null,
  sku: string | null,
  excludeId?: string,
): Promise<void> {
  if (slug) {
    const clash = await productsRepo.findProductBySlug(db, slug, excludeId);
    if (clash) throw new ConflictError('Product slug already exists');
  }
  if (sku) {
    const clash = await productsRepo.findProductBySku(db, sku, excludeId);
    if (clash) throw new ConflictError('Product SKU already exists');
  }
}

function archivedAtForStatus(
  next: ProductStatus,
  existing: ProductRow | null,
): Date | null {
  if (next === 'archived') {
    return existing?.archivedAt ?? new Date();
  }
  return null;
}

export async function listAdminProducts(url: URL): Promise<Paginated<AdminProductDTO>> {
  const page = Number(url.searchParams.get('page') ?? '1') || 1;
  const pageSize = Number(url.searchParams.get('pageSize') ?? '20') || 20;
  const q = url.searchParams.get('q') ?? undefined;
  const category = url.searchParams.get('category') ?? undefined;
  const sort = (url.searchParams.get('sort') as productsRepo.ProductListFilters['sort']) ?? undefined;
  const featuredParam = url.searchParams.get('featured');
  const inStockParam = url.searchParams.get('inStock');
  const statusParam = url.searchParams.get('status');
  const lowStock = url.searchParams.get('lowStock') === '1';

  let status: productsRepo.ProductListFilters['status'];
  if (statusParam === 'all') status = 'all';
  else if (
    statusParam === 'draft' ||
    statusParam === 'published' ||
    statusParam === 'hidden' ||
    statusParam === 'archived'
  ) {
    status = statusParam;
  } else {
    status = undefined;
  }

  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);
  const lowStockThreshold = lowStock
    ? await getLowStockThreshold(db)
    : undefined;
  const { rows, total } = await productsRepo.findProductsAdmin(db, {
    page,
    pageSize,
    q,
    category,
    sort,
    status,
    featured: featuredParam === 'true' ? true : undefined,
    inStock:
      inStockParam === 'true' ? true : inStockParam === 'false' ? false : undefined,
    lowStock: lowStock || undefined,
    lowStockThreshold,
  });

  return {
    items: rows.map((r) => toAdminProduct(r, pricing)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminProduct(id: string): Promise<AdminProductDTO> {
  const db = await getRequestDb();
  const pricing = await getPricingSettings(db);
  const row = await productsRepo.findProductByIdAny(db, id);
  if (!row) throw new NotFoundError('Product not found');
  return toAdminProduct(row, pricing);
}

export async function createAdminProduct(raw: unknown): Promise<AdminProductDTO> {
  const parsed = adminProductWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const cat = await categoriesRepo.findCategoryBySlug(db, parsed.data.categorySlug);
  if (!cat) throw new ValidationError('Invalid category');

  const id = `p-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  const status: ProductStatus = parsed.data.status ?? 'draft';
  const slug =
    emptyToNull(parsed.data.slug) ??
    `${slugify(parsed.data.name)}-${id.slice(2, 6)}`;
  const sku =
    emptyToNull(parsed.data.sku) ?? `SQ-${id.toUpperCase()}`;
  const stockQty = parsed.data.stockQty ?? (parsed.data.inStock ? 50 : 0);

  const desc = prepareProductDescription(
    parsed.data.description,
    parsed.data.descriptionFormat ?? 'plain',
  );

  await assertUniqueSlugSku(db, slug, sku);

  const pricing = await getPricingSettings(db);
  const basePriceUsd =
    parsed.data.basePriceUsd != null && parsed.data.basePriceUsd > 0
      ? parsed.data.basePriceUsd
      : null;
  const landedCost =
    basePriceUsd != null ? computeLandedCost(basePriceUsd, pricing) : null;
  const fulfilmentType = parsed.data.fulfilmentType ?? 'local_stock';
  const preorderEnabled = parsed.data.preorderEnabled ?? false;
  const preorderEtaDays =
    preorderEnabled && parsed.data.preorderEtaDays != null
      ? parsed.data.preorderEtaDays
      : null;

  const row = await productsRepo.insertProduct(db, {
    id,
    name: parsed.data.name,
    categorySlug: parsed.data.categorySlug,
    basePrice: parsed.data.basePrice,
    compareAtPrice: parsed.data.compareAtPrice ?? null,
    description: desc.description,
    images: parsed.data.images ?? [],
    rating: 0,
    reviewCount: 0,
    inStock: parsed.data.inStock && stockQty > 0,
    featured: parsed.data.featured,
    tags: parsed.data.tags ?? null,
    createdAt: new Date(),
    slug,
    sku,
    status,
    stockQty,
    reservedQty: 0,
    seoTitle: emptyToNull(parsed.data.seoTitle),
    seoDescription: emptyToNull(parsed.data.seoDescription),
    ogImage: emptyToNull(parsed.data.ogImage),
    canonicalUrl: emptyToNull(parsed.data.canonicalUrl),
    descriptionFormat: desc.descriptionFormat,
    archivedAt: archivedAtForStatus(status, null),
    basePriceUsd,
    landedCost,
    fulfilmentType,
    preorderEnabled,
    preorderEtaDays,
  });

  if (stockQty > 0) {
    await inventoryRepo.insertMovement(db, {
      id: `im_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      productId: id,
      oldQty: 0,
      newQty: stockQty,
      delta: stockQty,
      reason: 'restock',
      orderId: null,
      actorId: null,
      note: 'Initial stock',
      createdAt: new Date(),
    });
  }

  return toAdminProduct(row, pricing);
}

export async function updateAdminProduct(
  id: string,
  raw: unknown,
): Promise<AdminProductDTO> {
  const parsed = adminProductWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const existing = await productsRepo.findProductByIdAny(db, id);
  if (!existing) throw new NotFoundError('Product not found');

  const cat = await categoriesRepo.findCategoryBySlug(db, parsed.data.categorySlug);
  if (!cat) throw new ValidationError('Invalid category');

  const status: ProductStatus = parsed.data.status ?? existing.status;
  const slug =
    parsed.data.slug !== undefined
      ? emptyToNull(parsed.data.slug) ?? existing.slug
      : existing.slug;
  const sku =
    parsed.data.sku !== undefined
      ? emptyToNull(parsed.data.sku) ?? existing.sku
      : existing.sku;

  await assertUniqueSlugSku(db, slug, sku, id);

  const stockQty = existing.stockQty;
  const desc = prepareProductDescription(
    parsed.data.description,
    parsed.data.descriptionFormat ?? existing.descriptionFormat ?? 'plain',
  );

  const pricing = await getPricingSettings(db);
  const basePriceUsd =
    parsed.data.basePriceUsd !== undefined
      ? parsed.data.basePriceUsd != null && parsed.data.basePriceUsd > 0
        ? parsed.data.basePriceUsd
        : null
      : existing.basePriceUsd;
  const landedCost =
    basePriceUsd != null ? computeLandedCost(basePriceUsd, pricing) : null;
  const fulfilmentType =
    parsed.data.fulfilmentType ?? existing.fulfilmentType ?? 'local_stock';
  const preorderEnabled =
    parsed.data.preorderEnabled ?? existing.preorderEnabled ?? false;
  const preorderEtaDays = preorderEnabled
    ? parsed.data.preorderEtaDays !== undefined
      ? parsed.data.preorderEtaDays
      : existing.preorderEtaDays
    : null;

  const row = await productsRepo.updateProduct(db, id, {
    name: parsed.data.name,
    categorySlug: parsed.data.categorySlug,
    basePrice: parsed.data.basePrice,
    compareAtPrice: parsed.data.compareAtPrice ?? null,
    description: desc.description,
    descriptionFormat: desc.descriptionFormat,
    images: parsed.data.images ?? existing.images,
    inStock: parsed.data.inStock,
    featured: parsed.data.featured,
    tags: parsed.data.tags ?? null,
    stockQty,
    status,
    slug,
    sku,
    seoTitle:
      parsed.data.seoTitle !== undefined
        ? emptyToNull(parsed.data.seoTitle)
        : existing.seoTitle,
    seoDescription:
      parsed.data.seoDescription !== undefined
        ? emptyToNull(parsed.data.seoDescription)
        : existing.seoDescription,
    ogImage:
      parsed.data.ogImage !== undefined
        ? emptyToNull(parsed.data.ogImage)
        : existing.ogImage,
    canonicalUrl:
      parsed.data.canonicalUrl !== undefined
        ? emptyToNull(parsed.data.canonicalUrl)
        : existing.canonicalUrl,
    archivedAt: archivedAtForStatus(status, existing),
    basePriceUsd,
    landedCost,
    fulfilmentType,
    preorderEnabled,
    preorderEtaDays,
  });
  return toAdminProduct(row, pricing);
}

export async function deleteAdminProduct(id: string): Promise<{ ok: true }> {
  const db = await getRequestDb();
  const existing = await productsRepo.findProductByIdAny(db, id);
  if (!existing) throw new NotFoundError('Product not found');

  if (existing.status !== 'archived') {
    await productsRepo.updateProduct(db, id, {
      status: 'archived',
      archivedAt: new Date(),
    });
    return { ok: true };
  }

  const refs = await productsRepo.countOrderItemsForProduct(db, id);
  if (refs > 0) {
    throw new ConflictError(
      'Cannot permanently delete product referenced by existing orders',
    );
  }

  for (const url of existing.images ?? []) {
    const key = mediaUrlToKey(url);
    if (key) await deleteUploadObject(key).catch(() => undefined);
  }

  await productsRepo.deleteProduct(db, id);
  return { ok: true };
}

export async function restoreAdminProduct(id: string): Promise<AdminProductDTO> {
  const db = await getRequestDb();
  const existing = await productsRepo.findProductByIdAny(db, id);
  if (!existing) throw new NotFoundError('Product not found');
  if (existing.status !== 'archived') {
    throw new ValidationError('Only archived products can be restored');
  }

  const row = await productsRepo.updateProduct(db, id, {
    status: 'draft',
    archivedAt: null,
  });
  const pricing = await getPricingSettings(db);
  return toAdminProduct(row, pricing);
}

export async function duplicateAdminProduct(
  id: string,
): Promise<AdminProductDTO> {
  const db = await getRequestDb();
  const source = await productsRepo.findProductByIdAny(db, id);
  if (!source) throw new NotFoundError('Product not found');

  const newId = `p-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  const slug = `${slugify(source.name)}-${newId.slice(2, 6)}`;
  const sku = `SQ-${newId.toUpperCase()}`;

  const row = await productsRepo.insertProduct(db, {
    id: newId,
    name: `${source.name} (copy)`,
    categorySlug: source.categorySlug,
    basePrice: source.basePrice,
    compareAtPrice: source.compareAtPrice,
    description: source.description,
    images: [...(source.images ?? [])],
    rating: 0,
    reviewCount: 0,
    inStock: false,
    featured: false,
    tags: source.tags,
    createdAt: new Date(),
    slug,
    sku,
    status: 'draft',
    stockQty: 0,
    reservedQty: 0,
    seoTitle: null,
    seoDescription: null,
    ogImage: null,
    canonicalUrl: null,
    descriptionFormat: source.descriptionFormat ?? 'plain',
    archivedAt: null,
    basePriceUsd: source.basePriceUsd,
    landedCost: source.landedCost,
    sourceProvider: source.sourceProvider,
    sourceUrl: source.sourceUrl,
    sourceProductId: source.sourceProductId
      ? `${source.sourceProductId}-copy`
      : null,
    sourceVariantMap: source.sourceVariantMap,
    sourceInStock: source.sourceInStock,
    lastSyncedAt: null,
    fulfilmentType: source.fulfilmentType ?? 'local_stock',
    preorderEnabled: source.preorderEnabled ?? false,
    preorderEtaDays: source.preorderEtaDays,
  });

  const pricing = await getPricingSettings(db);
  return toAdminProduct(row, pricing);
}

export async function bulkAdminProducts(
  raw: unknown,
): Promise<AdminProductBulkResult> {
  const parsed = adminProductBulkSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const { ids, action, payload } = parsed.data;
  const db = await getRequestDb();

  if (action === 'set-category') {
    const slug = payload?.categorySlug;
    if (!slug) throw new ValidationError('categorySlug required for set-category');
    const cat = await categoriesRepo.findCategoryBySlug(db, slug);
    if (!cat) throw new ValidationError('Invalid category');
  }

  const results: AdminProductBulkResult['results'] = [];

  for (const productId of ids) {
    try {
      const existing = await productsRepo.findProductByIdAny(db, productId);
      if (!existing) {
        results.push({ id: productId, ok: false, error: 'Not found' });
        continue;
      }

      switch (action) {
        case 'archive':
          await productsRepo.updateProduct(db, productId, {
            status: 'archived',
            archivedAt: existing.archivedAt ?? new Date(),
          });
          break;
        case 'publish':
          await productsRepo.updateProduct(db, productId, {
            status: 'published',
            archivedAt: null,
          });
          break;
        case 'hide':
          await productsRepo.updateProduct(db, productId, {
            status: 'hidden',
            archivedAt: null,
          });
          break;
        case 'set-category':
          await productsRepo.updateProduct(db, productId, {
            categorySlug: payload!.categorySlug!,
          });
          break;
      }
      results.push({ id: productId, ok: true });
    } catch (err) {
      results.push({
        id: productId,
        ok: false,
        error: err instanceof Error ? err.message : 'Failed',
      });
    }
  }

  return { results };
}

function csvEscape(value: string | number | boolean | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportAdminProductsCsv(): Promise<string> {
  const db = await getRequestDb();
  const { rows } = await productsRepo.findProductsAdmin(db, {
    status: 'all',
    page: 1,
    pageSize: 100,
    sort: 'newest',
  });
  // Fetch all pages
  const all: ProductRow[] = [...rows];
  const totalPages = Math.max(
    1,
    Math.ceil(
      (
        await productsRepo.findProductsAdmin(db, {
          status: 'all',
          page: 1,
          pageSize: 1,
        })
      ).total / 100,
    ),
  );
  for (let page = 2; page <= totalPages; page++) {
    const next = await productsRepo.findProductsAdmin(db, {
      status: 'all',
      page,
      pageSize: 100,
      sort: 'newest',
    });
    all.push(...next.rows);
  }

  const header = [
    'id',
    'name',
    'categorySlug',
    'basePrice',
    'compareAtPrice',
    'description',
    'descriptionFormat',
    'sku',
    'slug',
    'status',
    'stockQty',
    'inStock',
    'featured',
    'tags',
    'images',
  ];
  const lines = [header.join(',')];
  for (const row of all) {
    lines.push(
      [
        csvEscape(row.id),
        csvEscape(row.name),
        csvEscape(row.categorySlug),
        csvEscape(row.basePrice),
        csvEscape(row.compareAtPrice),
        csvEscape(row.description),
        csvEscape(row.descriptionFormat),
        csvEscape(row.sku),
        csvEscape(row.slug),
        csvEscape(row.status),
        csvEscape(row.stockQty),
        csvEscape(row.inStock),
        csvEscape(row.featured),
        csvEscape((row.tags ?? []).join('|')),
        csvEscape((row.images ?? []).join('|')),
      ].join(','),
    );
  }
  return lines.join('\n');
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

export async function importAdminProductsCsv(
  text: string,
): Promise<AdminCsvImportReport> {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new ValidationError('CSV must include a header and at least one row');
  }

  const header = parseCsvLine(lines[0]!).map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const required = ['name', 'categorySlug', 'basePrice', 'description'] as const;
  for (const col of required) {
    if (idx(col) < 0) throw new ValidationError(`Missing CSV column: ${col}`);
  }

  const db = await getRequestDb();
  let created = 0;
  let updated = 0;
  const errors: AdminCsvImportReport['errors'] = [];

  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvLine(lines[r]!);
    const get = (name: string) => {
      const i = idx(name);
      return i >= 0 ? (cells[i] ?? '').trim() : '';
    };

    try {
      const name = get('name');
      const categorySlug = get('categorySlug');
      const basePrice = Number(get('basePrice'));
      const description = get('description');
      if (!name || !categorySlug || !description || !Number.isFinite(basePrice)) {
        throw new Error('Invalid required fields');
      }
      const cat = await categoriesRepo.findCategoryBySlug(db, categorySlug);
      if (!cat) throw new Error('Invalid category');

      const sku = get('sku') || null;
      const slug = get('slug') || null;
      const existingBySku = sku
        ? await productsRepo.findProductBySku(db, sku)
        : null;
      const existingBySlug =
        !existingBySku && slug
          ? await productsRepo.findProductBySlug(db, slug)
          : null;
      const existing = existingBySku ?? existingBySlug;

      const tagsRaw = get('tags');
      const tags = tagsRaw
        ? tagsRaw.split('|').map((t) => t.trim()).filter(Boolean)
        : null;
      const imagesRaw = get('images');
      const images = imagesRaw
        ? imagesRaw.split('|').map((t) => t.trim()).filter(Boolean)
        : [];
      const format =
        get('descriptionFormat') === 'html' ? ('html' as const) : ('plain' as const);
      const desc = prepareProductDescription(description, format);
      const stockQty = Math.max(0, Number(get('stockQty') || '0') || 0);
      const compareAt = get('compareAtPrice');
      const compareAtPrice =
        compareAt && Number.isFinite(Number(compareAt))
          ? Number(compareAt)
          : null;

      if (existing) {
        await productsRepo.updateProduct(db, existing.id, {
          name,
          categorySlug,
          basePrice,
          compareAtPrice,
          description: desc.description,
          descriptionFormat: desc.descriptionFormat,
          tags,
          images: images.length ? images : existing.images,
          stockQty,
          inStock: get('inStock') !== 'false' && stockQty > 0,
          featured: get('featured') === 'true',
          status: 'draft',
          archivedAt: null,
          sku: sku ?? existing.sku,
          slug: slug ?? existing.slug,
        });
        updated++;
      } else {
        const id = `p-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
        const finalSlug = slug ?? `${slugify(name)}-${id.slice(2, 6)}`;
        const finalSku = sku ?? `SQ-${id.toUpperCase()}`;
        await assertUniqueSlugSku(db, finalSlug, finalSku);
        await productsRepo.insertProduct(db, {
          id,
          name,
          categorySlug,
          basePrice,
          compareAtPrice,
          description: desc.description,
          descriptionFormat: desc.descriptionFormat,
          images,
          rating: 0,
          reviewCount: 0,
          inStock: stockQty > 0,
          featured: get('featured') === 'true',
          tags,
          createdAt: new Date(),
          slug: finalSlug,
          sku: finalSku,
          status: 'draft',
          stockQty,
          reservedQty: 0,
          seoTitle: null,
          seoDescription: null,
          ogImage: null,
          canonicalUrl: null,
          archivedAt: null,
        });
        created++;
      }
    } catch (err) {
      errors.push({
        row: r + 1,
        message: err instanceof Error ? err.message : 'Row failed',
      });
    }
  }

  return { created, updated, errors };
}

export async function addProductImages(
  id: string,
  files: File[],
): Promise<AdminProductDTO> {
  if (files.length === 0) {
    throw new ValidationError('At least one image file is required');
  }
  const db = await getRequestDb();
  const existing = await productsRepo.findProductByIdAny(db, id);
  if (!existing) throw new NotFoundError('Product not found');

  const urls = [...(existing.images ?? [])];
  for (const file of files) {
    const uploaded = await uploadProcessedCatalogImage(
      `products/${id}`,
      file,
      'product',
    );
    urls.push(uploaded.url);
  }
  const row = await productsRepo.updateProduct(db, id, { images: urls });
  const pricing = await getPricingSettings(db);
  return toAdminProduct(row, pricing);
}

export async function removeProductImage(
  id: string,
  url: string,
): Promise<AdminProductDTO> {
  const db = await getRequestDb();
  const existing = await productsRepo.findProductByIdAny(db, id);
  if (!existing) throw new NotFoundError('Product not found');

  const images = (existing.images ?? []).filter((u) => u !== url);
  if (images.length === (existing.images ?? []).length) {
    throw new NotFoundError('Image not found on product');
  }
  const key = mediaUrlToKey(url);
  if (key) await deleteUploadObject(key).catch(() => undefined);

  const row = await productsRepo.updateProduct(db, id, { images });
  const pricing = await getPricingSettings(db);
  return toAdminProduct(row, pricing);
}

export async function listAdminCategories(): Promise<AdminCategoryDTO[]> {
  const db = await getRequestDb();
  const rows = await categoriesRepo.findAllCategories(db);
  return rows.map(toAdminCategory);
}

export async function createAdminCategory(raw: unknown): Promise<AdminCategoryDTO> {
  const parsed = adminCategoryWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const existing = await categoriesRepo.findCategoryBySlug(db, parsed.data.slug);
  if (existing) throw new ConflictError('Category slug already exists');

  const row = await categoriesRepo.insertCategory(db, {
    slug: parsed.data.slug,
    name: parsed.data.name,
    image: parsed.data.image || '/images/cat-medium.svg',
    seoDescription: parsed.data.seoDescription,
    sortOrder: parsed.data.sortOrder ?? 99,
  });
  return toAdminCategory(row);
}

export async function updateAdminCategory(
  slug: string,
  raw: unknown,
): Promise<AdminCategoryDTO> {
  const body = adminCategoryWriteSchema.partial().safeParse(raw);
  if (!body.success) {
    throw new ValidationError('Validation failed', body.error.flatten());
  }

  const db = await getRequestDb();
  const existing = await categoriesRepo.findCategoryBySlug(db, slug);
  if (!existing) throw new NotFoundError('Category not found');

  if (body.data.slug && body.data.slug !== slug) {
    throw new ValidationError('Changing category slug is not supported in P9');
  }

  const row = await categoriesRepo.updateCategory(db, slug, {
    name: body.data.name ?? existing.name,
    image: body.data.image ?? existing.image,
    seoDescription: body.data.seoDescription ?? existing.seoDescription,
    sortOrder: body.data.sortOrder ?? existing.sortOrder,
  });
  return toAdminCategory(row);
}

export async function deleteAdminCategory(slug: string): Promise<{ ok: true }> {
  const db = await getRequestDb();
  const existing = await categoriesRepo.findCategoryBySlug(db, slug);
  if (!existing) throw new NotFoundError('Category not found');

  const refs = await productsRepo.countProductsByCategory(db, slug);
  if (refs > 0) {
    throw new ConflictError('Cannot delete category that still has products');
  }

  const key = mediaUrlToKey(existing.image);
  if (key) await deleteUploadObject(key).catch(() => undefined);

  await categoriesRepo.deleteCategory(db, slug);
  return { ok: true };
}

export async function setCategoryImage(
  slug: string,
  file: File,
): Promise<AdminCategoryDTO> {
  const db = await getRequestDb();
  const existing = await categoriesRepo.findCategoryBySlug(db, slug);
  if (!existing) throw new NotFoundError('Category not found');

  const uploaded = await uploadProcessedCatalogImage(
    `categories/${slug}`,
    file,
    'product',
  );
  const row = await categoriesRepo.updateCategory(db, slug, {
    image: uploaded.url,
  });
  const oldKey = mediaUrlToKey(existing.image);
  if (oldKey) await deleteUploadObject(oldKey).catch(() => undefined);

  return toAdminCategory(row);
}
