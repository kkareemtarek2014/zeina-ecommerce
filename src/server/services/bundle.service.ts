import 'server-only';
import { inArray } from 'drizzle-orm';
import { isFeatureEnabled } from '@/config/features.config';
import {
  adminBundleActiveSchema,
  adminBundleUpdateSchema,
  adminBundleWriteSchema,
  bundleEvaluateInputSchema,
  type AdminBundleDTO,
  type BundleEvaluateResult,
} from '@/shared/contracts/admin-bundles.contract';
import { getRequestDb } from '@/server/db/request';
import { products } from '@/server/db/schema';
import {
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import type { Db } from '@/server/db/client';
import * as bundlesRepo from '@/server/repositories/bundles.repo';
import type {
  BundleItemRow,
  BundleRow,
} from '@/server/repositories/bundles.repo';
import {
  computeSellPrice,
  getPricingSettings,
  pricingInputFromRow,
} from '@/server/services/pricing.service';
import { listPublishedProductsByIds } from '@/server/services/product.service';
import * as productsRepo from '@/server/repositories/products.repo';
import type { ProductDTO } from '@/shared/contracts/product.contract';

export type CartPriceLine = {
  productId: string;
  unitPrice: number;
  quantity: number;
};

function toDto(
  bundle: BundleRow,
  items: BundleItemRow[],
): AdminBundleDTO {
  const dto: AdminBundleDTO = {
    id: bundle.id,
    name: bundle.name,
    type: bundle.type,
    config: bundle.config ?? {},
    active: bundle.active,
    createdAt: bundle.createdAt.toISOString(),
    items: items.map((i) => ({
      productId: i.productId,
      qty: i.qty,
    })),
  };
  if (bundle.startsAt) dto.startsAt = bundle.startsAt.toISOString();
  else dto.startsAt = null;
  if (bundle.endsAt) dto.endsAt = bundle.endsAt.toISOString();
  else dto.endsAt = null;
  return dto;
}

function parseOptionalDate(value: string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new ValidationError('Invalid date');
  }
  return d;
}

function discountBxgy(
  lines: CartPriceLine[],
  allowedIds: Set<string>,
  buyQty: number,
  getQty: number,
): number {
  const units: number[] = [];
  for (const line of lines) {
    if (!allowedIds.has(line.productId)) continue;
    for (let i = 0; i < line.quantity; i++) {
      units.push(line.unitPrice);
    }
  }
  units.sort((a, b) => a - b);
  const group = buyQty + getQty;
  if (group <= 0 || units.length < group) return 0;
  const freeCount = Math.floor(units.length / group) * getQty;
  let discount = 0;
  for (let i = 0; i < freeCount; i++) {
    discount += units[i] ?? 0;
  }
  return discount;
}

function discountFixedSet(
  lines: CartPriceLine[],
  items: BundleItemRow[],
  fixedPrice: number,
): number {
  let sum = 0;
  for (const bi of items) {
    const line = lines.find((l) => l.productId === bi.productId);
    if (!line || line.quantity < bi.qty) return 0;
    sum += line.unitPrice * bi.qty;
  }
  return Math.max(0, sum - fixedPrice);
}

export function computeBestBundleDiscount(
  lines: CartPriceLine[],
  active: Array<{ bundle: BundleRow; items: BundleItemRow[] }>,
): BundleEvaluateResult {
  let best: BundleEvaluateResult = {
    discount: 0,
    bundleId: null,
    bundleName: null,
  };

  for (const { bundle, items } of active) {
    if (items.length === 0) continue;
    const allowed = new Set(items.map((i) => i.productId));
    let discount = 0;

    if (bundle.type === 'bxgy') {
      const buyQty = Number(bundle.config?.buyQty);
      const getQty = Number(bundle.config?.getQty);
      if (!Number.isFinite(buyQty) || !Number.isFinite(getQty)) continue;
      discount = discountBxgy(lines, allowed, buyQty, getQty);
    } else {
      const price = Number(bundle.config?.price);
      if (!Number.isFinite(price) || price < 0) continue;
      discount = discountFixedSet(lines, items, Math.round(price));
    }

    if (discount > best.discount) {
      best = {
        discount,
        bundleId: bundle.id,
        bundleName: bundle.name,
      };
    }
  }

  return best;
}

export async function evaluateBundlesForLines(
  db: Db,
  lines: CartPriceLine[],
): Promise<BundleEvaluateResult> {
  if (!isFeatureEnabled('bundles') || lines.length === 0) {
    return { discount: 0, bundleId: null, bundleName: null };
  }
  const active = await bundlesRepo.listActiveBundles(db);
  return computeBestBundleDiscount(lines, active);
}

export async function evaluateBundlesFromInput(
  raw: unknown,
): Promise<BundleEvaluateResult> {
  if (!isFeatureEnabled('bundles')) {
    return { discount: 0, bundleId: null, bundleName: null };
  }
  const parsed = bundleEvaluateInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const db = await getRequestDb();
  const ids = [...new Set(parsed.data.items.map((i) => i.productId))];
  const rows = await db
    .select()
    .from(products)
    .where(inArray(products.id, ids));
  if (rows.length !== ids.length) {
    throw new NotFoundError('One or more products were not found');
  }
  const pricing = await getPricingSettings(db);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines: CartPriceLine[] = parsed.data.items.map((line) => {
    const product = byId.get(line.productId)!;
    return {
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: computeSellPrice(pricingInputFromRow(product), pricing),
    };
  });
  return evaluateBundlesForLines(db, lines);
}

export async function listAdminBundles(): Promise<AdminBundleDTO[]> {
  const db = await getRequestDb();
  const rows = await bundlesRepo.listBundles(db);
  return rows.map(({ bundle, items }) => toDto(bundle, items));
}

export async function createAdminBundle(raw: unknown): Promise<AdminBundleDTO> {
  const parsed = adminBundleWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const productIds = [...new Set(parsed.data.items.map((i) => i.productId))];
  const found = await db
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.id, productIds));
  if (found.length !== productIds.length) {
    throw new ValidationError('One or more bundle products are invalid');
  }

  const id = `bdl_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date();
  const row: BundleRow = {
    id,
    name: parsed.data.name,
    type: parsed.data.type,
    config: parsed.data.config,
    active: parsed.data.active ?? true,
    startsAt: parseOptionalDate(parsed.data.startsAt),
    endsAt: parseOptionalDate(parsed.data.endsAt),
    createdAt: now,
  };
  const items: BundleItemRow[] = parsed.data.items.map((i) => ({
    bundleId: id,
    productId: i.productId,
    qty: i.qty,
  }));
  const created = await bundlesRepo.insertBundle(db, row, items);
  return toDto(created.bundle, created.items);
}

export async function updateAdminBundle(
  id: string,
  raw: unknown,
): Promise<AdminBundleDTO> {
  const parsed = adminBundleUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  if (Object.keys(parsed.data).length === 0) {
    throw new ValidationError('No fields to update');
  }

  const db = await getRequestDb();
  const existing = await bundlesRepo.findBundleById(db, id);
  if (!existing) throw new NotFoundError('Bundle not found');

  const nextType = parsed.data.type ?? existing.bundle.type;
  const nextConfig = parsed.data.config ?? existing.bundle.config;
  const mergedWrite = adminBundleWriteSchema.safeParse({
    name: parsed.data.name ?? existing.bundle.name,
    type: nextType,
    config: nextConfig,
    items: parsed.data.items ?? existing.items.map((i) => ({
      productId: i.productId,
      qty: i.qty,
    })),
    active: parsed.data.active ?? existing.bundle.active,
    startsAt:
      parsed.data.startsAt !== undefined
        ? parsed.data.startsAt
        : existing.bundle.startsAt?.toISOString() ?? null,
    endsAt:
      parsed.data.endsAt !== undefined
        ? parsed.data.endsAt
        : existing.bundle.endsAt?.toISOString() ?? null,
  });
  if (!mergedWrite.success) {
    throw new ValidationError('Validation failed', mergedWrite.error.flatten());
  }

  let items: BundleItemRow[] | null = null;
  if (parsed.data.items) {
    const productIds = [...new Set(parsed.data.items.map((i) => i.productId))];
    const found = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, productIds));
    if (found.length !== productIds.length) {
      throw new ValidationError('One or more bundle products are invalid');
    }
    items = parsed.data.items.map((i) => ({
      bundleId: id,
      productId: i.productId,
      qty: i.qty,
    }));
  }

  const updated = await bundlesRepo.replaceBundle(
    db,
    id,
    {
      name: mergedWrite.data.name,
      type: mergedWrite.data.type,
      config: mergedWrite.data.config,
      active: mergedWrite.data.active ?? existing.bundle.active,
      startsAt: parseOptionalDate(mergedWrite.data.startsAt),
      endsAt: parseOptionalDate(mergedWrite.data.endsAt),
    },
    items,
  );
  if (!updated) throw new NotFoundError('Bundle not found');
  return toDto(updated.bundle, updated.items);
}

export async function toggleAdminBundle(
  id: string,
  raw: unknown,
): Promise<AdminBundleDTO> {
  const parsed = adminBundleActiveSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const existing = await bundlesRepo.findBundleById(db, id);
  if (!existing) throw new NotFoundError('Bundle not found');
  const updated = await bundlesRepo.replaceBundle(
    db,
    id,
    { active: parsed.data.active },
    null,
  );
  if (!updated) throw new NotFoundError('Bundle not found');
  return toDto(updated.bundle, updated.items);
}

export async function deleteAdminBundle(id: string): Promise<{ ok: true }> {
  const db = await getRequestDb();
  const ok = await bundlesRepo.deleteBundle(db, id);
  if (!ok) throw new NotFoundError('Bundle not found');
  return { ok: true };
}

export async function listStorefrontBundleHintsForProduct(
  productId: string,
): Promise<
  Array<{
    id: string;
    name: string;
    type: BundleRow['type'];
    config: Record<string, unknown>;
    productIds: string[];
    products: Array<{
      id: string;
      name: string;
      image: string;
      price: number;
    }>;
    savingsEgp: number | null;
  }>
> {
  if (!isFeatureEnabled('bundles')) return [];
  const db = await getRequestDb();
  const linked = await bundlesRepo.findProductBundles(db, productId);
  const now = new Date();
  const active = linked.filter(({ bundle }) => {
    if (!bundle.active) return false;
    if (bundle.startsAt && bundle.startsAt > now) return false;
    if (bundle.endsAt && bundle.endsAt < now) return false;
    return true;
  }).slice(0, 3);

  if (active.length === 0) return [];

  const pricing = await getPricingSettings(db);
  const out: Array<{
    id: string;
    name: string;
    type: BundleRow['type'];
    config: Record<string, unknown>;
    productIds: string[];
    products: Array<{
      id: string;
      name: string;
      image: string;
      price: number;
    }>;
    savingsEgp: number | null;
  }> = [];

  for (const { bundle, items } of active) {
    const productIds = items.map((i) => i.productId);
    const productPreviews: Array<{
      id: string;
      name: string;
      image: string;
      price: number;
    }> = [];
    let separateTotal = 0;

    for (const item of items) {
      const row = await productsRepo.findProductById(db, item.productId);
      if (!row) continue;
      const price = computeSellPrice(pricingInputFromRow(row), pricing);
      separateTotal += price * item.qty;
      productPreviews.push({
        id: row.id,
        name: row.name,
        image: row.images[0] ?? '',
        price,
      });
    }

    let savingsEgp: number | null = null;
    if (bundle.type === 'fixed_price' || bundle.type === 'set') {
      const fixed = Number(bundle.config?.price);
      if (Number.isFinite(fixed) && fixed >= 0) {
        savingsEgp = Math.max(0, separateTotal - Math.round(fixed));
      }
    } else if (bundle.type === 'bxgy') {
      const getQty = Number(bundle.config?.getQty);
      const prices = productPreviews.map((p) => p.price).sort((a, b) => a - b);
      if (Number.isFinite(getQty) && getQty > 0 && prices.length > 0) {
        savingsEgp = prices
          .slice(0, Math.min(getQty, prices.length))
          .reduce((s, p) => s + p, 0);
      }
    }

    out.push({
      id: bundle.id,
      name: bundle.name,
      type: bundle.type,
      config: bundle.config ?? {},
      productIds,
      products: productPreviews,
      savingsEgp: savingsEgp && savingsEgp > 0 ? savingsEgp : null,
    });
  }

  return out;
}

/**
 * Products featured by any currently active bundle (storefront `/bundles`).
 * Reuses catalog DTO mapping — no CMS prices/stock.
 */
export async function listStorefrontBundleProducts(
  limit = 24,
): Promise<ProductDTO[]> {
  if (!isFeatureEnabled('bundles')) return [];
  const db = await getRequestDb();
  const active = await bundlesRepo.listActiveBundles(db);
  const ids = active.flatMap(({ items }) => items.map((i) => i.productId));
  return listPublishedProductsByIds(ids, limit);
}

export type BundleSpotlightDTO = {
  id: string;
  name: string;
  image: string;
  itemCount: number;
  price: number | null;
  compareAtPrice: number | null;
  savingsEgp: number | null;
};

/**
 * One active bundle for the homepage "Mystery Box" spotlight moment.
 * Picks the first active bundle (admin-ordered); returns null when the
 * `bundles` flag is off or nothing is active — the section simply hides.
 */
export async function getHomepageBundleSpotlight(): Promise<BundleSpotlightDTO | null> {
  if (!isFeatureEnabled('bundles')) return null;
  const db = await getRequestDb();
  const active = await bundlesRepo.listActiveBundles(db);
  const first = active[0];
  if (!first) return null;

  const { bundle, items } = first;
  const pricing = await getPricingSettings(db);
  let separateTotal = 0;
  let image = '';

  for (const item of items) {
    const row = await productsRepo.findProductById(db, item.productId);
    if (!row) continue;
    if (!image) image = row.images[0] ?? '';
    separateTotal += computeSellPrice(pricingInputFromRow(row), pricing) * item.qty;
  }

  if (!image) return null; // no resolvable products — nothing honest to show

  let price: number | null = null;
  if (bundle.type === 'fixed_price' || bundle.type === 'set') {
    const fixed = Number(bundle.config?.price);
    if (Number.isFinite(fixed) && fixed >= 0) price = Math.round(fixed);
  }

  const savingsEgp =
    price != null && separateTotal > price ? separateTotal - price : null;

  return {
    id: bundle.id,
    name: bundle.name,
    image,
    itemCount: items.reduce((sum, i) => sum + i.qty, 0),
    price,
    compareAtPrice: price != null && savingsEgp ? separateTotal : null,
    savingsEgp,
  };
}
