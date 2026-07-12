import 'server-only';
import {
  adminCategoryWriteSchema,
  adminProductWriteSchema,
  type AdminCategoryDTO,
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
  computeSellPrice,
  getProfitMargin,
} from '@/server/services/pricing.service';
import {
  deleteUploadObject,
  mediaUrlToKey,
  putCatalogImage,
} from '@/server/services/upload.service';
import {
  availableQty,
  isEffectivelyInStock,
} from '@/server/lib/stock';
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

function toAdminProduct(row: ProductRow, margin: number): AdminProductDTO {
  const dto: AdminProductDTO = {
    id: row.id,
    name: row.name,
    category: row.categorySlug,
    basePrice: row.basePrice,
    price: computeSellPrice(row.basePrice, margin),
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
  const margin = await getProfitMargin(db);
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
  });

  return {
    items: rows.map((r) => toAdminProduct(r, margin)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminProduct(id: string): Promise<AdminProductDTO> {
  const db = await getRequestDb();
  const margin = await getProfitMargin(db);
  const row = await productsRepo.findProductByIdAny(db, id);
  if (!row) throw new NotFoundError('Product not found');
  return toAdminProduct(row, margin);
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
    emptyToNull(parsed.data.sku) ?? `ZAYA-${id.toUpperCase()}`;
  const stockQty = parsed.data.stockQty ?? (parsed.data.inStock ? 50 : 0);

  await assertUniqueSlugSku(db, slug, sku);

  const row = await productsRepo.insertProduct(db, {
    id,
    name: parsed.data.name,
    categorySlug: parsed.data.categorySlug,
    basePrice: parsed.data.basePrice,
    compareAtPrice: parsed.data.compareAtPrice ?? null,
    description: parsed.data.description,
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
    descriptionFormat: 'plain',
    archivedAt: archivedAtForStatus(status, null),
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

  const margin = await getProfitMargin(db);
  return toAdminProduct(row, margin);
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

  const row = await productsRepo.updateProduct(db, id, {
    name: parsed.data.name,
    categorySlug: parsed.data.categorySlug,
    basePrice: parsed.data.basePrice,
    compareAtPrice: parsed.data.compareAtPrice ?? null,
    description: parsed.data.description,
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
  });
  const margin = await getProfitMargin(db);
  return toAdminProduct(row, margin);
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
  const margin = await getProfitMargin(db);
  return toAdminProduct(row, margin);
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
    const uploaded = await putCatalogImage(`products/${id}`, file);
    urls.push(uploaded.url);
  }
  const row = await productsRepo.updateProduct(db, id, { images: urls });
  const margin = await getProfitMargin(db);
  return toAdminProduct(row, margin);
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
  const margin = await getProfitMargin(db);
  return toAdminProduct(row, margin);
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
    image: parsed.data.image || '/images/cat-jewelry.svg',
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

  const uploaded = await putCatalogImage(`categories/${slug}`, file);
  const oldKey = mediaUrlToKey(existing.image);
  if (oldKey) await deleteUploadObject(oldKey).catch(() => undefined);

  const row = await categoriesRepo.updateCategory(db, slug, {
    image: uploaded.url,
  });
  return toAdminCategory(row);
}
