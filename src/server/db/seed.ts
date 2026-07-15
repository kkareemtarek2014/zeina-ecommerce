/**
 * Local D1 seeder — ports src/shared/data (+ reviews/wallet/mock order) into D1.
 * Idempotent via INSERT OR IGNORE / onConflictDoNothing.
 *
 * Run: pnpm db:seed
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getPlatformProxy } from 'wrangler';
import { eq } from 'drizzle-orm';
import { getDb } from './client';
import {
  categories,
  governorates,
  orderItems,
  orders,
  products,
  promos,
  reviews,
  settings,
  shippingZones,
  users,
  walletTransactions,
} from './schema';
import { hashPassword } from '../auth/password';
import { CATEGORIES } from '@/shared/data/categories.data';
import { PRODUCTS } from '@/shared/data/products.data';
import { GOVERNORATES } from '@/shared/data/governorates.data';
import { PROMOS_DB } from '@/shared/data/promos.data';
import { SEED_USERS } from '@/shared/data/users.data';
import {
  FREE_SHIPPING_THRESHOLD,
  PROFIT_MARGIN,
  SHIPPING_RATES,
  SITE,
} from '@/config/site.config';

function loadDevVars(): void {
  const path = resolve(process.cwd(), '.dev.vars');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SEED_REVIEWS = [
  {
    id: 'rev_1',
    productId: 'p-001',
    authorName: 'Sarah M.',
    rating: 5,
    comment:
      'Absolutely love this piece! The quality is amazing and it looks exactly like the pictures. I got so many compliments wearing it to a wedding.',
    helpful: 12,
    createdAt: new Date(Date.now() - 86400000 * 60),
  },
  {
    id: 'rev_2',
    productId: 'p-001',
    authorName: 'Nour T.',
    rating: 4,
    comment:
      'Beautiful design and very elegant. It arrived perfectly packaged too. My only small issue is that the clasp is a bit tricky to handle alone.',
    helpful: 5,
    createdAt: new Date(Date.now() - 86400000 * 21),
  },
  {
    id: 'rev_3',
    productId: 'p-001',
    authorName: 'Amina S.',
    rating: 5,
    comment:
      'Perfect gift for my sister. The delivery was super fast to Alex and the customer service was very helpful when I had a question.',
    helpful: 0,
    createdAt: new Date(),
  },
] as const;

const ZONE_LABELS: Record<keyof typeof SHIPPING_RATES, string> = {
  cairo_giza: 'Cairo & Giza',
  near: 'Nearby governorates',
  far: 'Far (Upper Egypt / Sinai)',
};

const ADMIN_EMAIL = 'admin@zaya-eg.com';
const ADMIN_PASSWORD = 'password123';

/** D1 rejects large multi-row inserts (SQL variable limit). */
async function insertChunks<T extends Record<string, unknown>>(
  insertFn: (rows: T[]) => Promise<unknown>,
  rows: T[],
  chunkSize: number,
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    await insertFn(rows.slice(i, i + chunkSize));
  }
}

async function main() {
  loadDevVars();
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper) {
    throw new Error('PASSWORD_PEPPER missing — set it in .dev.vars');
  }

  const proxy = await getPlatformProxy({ persist: true });
  const env = proxy.env as unknown as CloudflareEnv;
  const db = getDb(env.DB);

  try {
    const now = new Date();
    const baseCreated = Date.now() - PRODUCTS.length * 86_400_000;

    await db
      .insert(categories)
      .values(
        CATEGORIES.map((c, i) => ({
          slug: c.slug,
          name: c.name,
          image: c.image,
          seoDescription: c.seoDescription,
          sortOrder: i,
        })),
      )
      .onConflictDoNothing();

    const productRows = PRODUCTS.map((p, i) => ({
      id: p.id,
      name: p.name,
      categorySlug: p.category,
      basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice ?? null,
      description: p.description,
      images: p.images,
      rating: p.rating,
      reviewCount: p.reviewCount,
      inStock: p.inStock,
      featured: p.featured ?? false,
      tags: p.tags ?? null,
      createdAt: new Date(baseCreated + i * 86_400_000),
      slug: slugify(p.name),
      sku: `ZAYA-${p.id.toUpperCase()}`,
      status: 'published' as const,
      stockQty: 50,
      reservedQty: 0,
    }));
    await insertChunks(
      (rows) => db.insert(products).values(rows).onConflictDoNothing(),
      productRows,
      4,
    );

    const governorateRows = GOVERNORATES.map((g) => ({
      id: g.id,
      name: g.name,
      zone: g.zone,
      // Default Bosta city name = our English name (admin can refine ids later)
      bostaCityId: g.name,
      bostaZone: null as string | null,
      bostaDistrict: null as string | null,
    }));
    await insertChunks(
      (rows) => db.insert(governorates).values(rows).onConflictDoNothing(),
      governorateRows,
      20,
    );

    await db
      .insert(promos)
      .values(
        PROMOS_DB.map((p) => ({
          code: p.code.toUpperCase(),
          type: p.type,
          value: p.value,
          minOrderValue: p.minOrderValue ?? null,
          active: true,
        })),
      )
      .onConflictDoNothing();

    await db
      .insert(shippingZones)
      .values(
        (Object.keys(SHIPPING_RATES) as Array<keyof typeof SHIPPING_RATES>).map((zone) => ({
          zone,
          label: ZONE_LABELS[zone],
          fee: SHIPPING_RATES[zone],
        })),
      )
      .onConflictDoNothing();

    const settingsRows: { key: string; value: unknown; updatedAt: Date }[] = [
      { key: 'profit_margin', value: PROFIT_MARGIN, updatedAt: now },
      { key: 'free_shipping_threshold', value: FREE_SHIPPING_THRESHOLD, updatedAt: now },
      { key: 'low_stock_threshold', value: 5, updatedAt: now },
      { key: 'site_name', value: SITE.name, updatedAt: now },
      { key: 'site_tagline', value: SITE.tagline, updatedAt: now },
      { key: 'site_url', value: SITE.url, updatedAt: now },
      {
        key: 'announcement_items',
        value: [
          {
            id: 'new-drop',
            text: 'New drop every week',
            href: '/shop',
            active: true,
            sortOrder: 0,
          },
          {
            id: 'free-shipping',
            text: `Free shipping over ${FREE_SHIPPING_THRESHOLD.toLocaleString('en-EG')} EGP`,
            href: '/shop',
            active: true,
            sortOrder: 1,
          },
          {
            id: 'cod',
            text: 'Cash on delivery, Egypt-wide',
            href: '/checkout',
            active: true,
            sortOrder: 2,
          },
        ],
        updatedAt: now,
      },
    ];
    await db.insert(settings).values(settingsRows).onConflictDoNothing();

    for (const seedUser of SEED_USERS) {
      const passwordHash = await hashPassword(seedUser.password, pepper);
      await db
        .insert(users)
        .values({
          id: seedUser.id,
          email: seedUser.email.toLowerCase(),
          name: seedUser.name,
          phone: seedUser.phone ?? null,
          passwordHash,
          role: 'customer',
          createdAt: now,
        })
        .onConflictDoNothing();
    }

    const adminHash = await hashPassword(ADMIN_PASSWORD, pepper);
    await db
      .insert(users)
      .values({
        id: 'user_admin',
        email: ADMIN_EMAIL,
        name: 'Zaya Admin',
        phone: null,
        passwordHash: adminHash,
        role: 'admin',
        createdAt: now,
      })
      .onConflictDoNothing();

    await db
      .insert(reviews)
      .values(
        SEED_REVIEWS.map((r) => ({
          id: r.id,
          productId: r.productId,
          userId: null,
          authorName: r.authorName,
          rating: r.rating,
          comment: r.comment,
          helpful: r.helpful,
          createdAt: r.createdAt,
        })),
      )
      .onConflictDoNothing();

    const productReviews = SEED_REVIEWS.filter((r) => r.productId === 'p-001');
    const avg =
      productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    await db
      .update(products)
      .set({
        rating: Math.round(avg * 10) / 10,
        reviewCount: productReviews.length,
      })
      .where(eq(products.id, 'p-001'));

    await db
      .insert(walletTransactions)
      .values([
        {
          id: 'txn_1',
          userId: 'user_1',
          type: 'credit' as const,
          amount: 500,
          description: 'Refund for Order #ZN-9921',
          createdAt: new Date(Date.now() - 86400000 * 5),
        },
        {
          id: 'txn_2',
          userId: 'user_1',
          type: 'debit' as const,
          amount: 150,
          description: 'Payment for Order #ZN-1044',
          createdAt: new Date(Date.now() - 86400000 * 2),
        },
      ])
      .onConflictDoNothing();

    // Mock order uses a real product id (storefront mock used "mock-1" which is not in catalog).
    const mockProduct = PRODUCTS[0]!;
    await db
      .insert(orders)
      .values({
        id: 'ZN-MOCK-123',
        userId: 'user_1',
        status: 'shipped',
        fullName: 'Jane Doe',
        phone: '01000000000',
        governorateId: 'cairo',
        city: 'New Cairo',
        street: '90th Street',
        addressNotes: null,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        subtotal: 500,
        discount: 0,
        shipping: 50,
        total: 550,
        promoCode: null,
        note: null,
        createdAt: now,
      })
      .onConflictDoNothing();

    await db
      .insert(orderItems)
      .values({
        id: 'oi_mock_1',
        orderId: 'ZN-MOCK-123',
        productId: mockProduct.id,
        name: mockProduct.name,
        image: mockProduct.images[0] ?? '/images/p-001.svg',
        unitPrice: 500,
        quantity: 1,
        isPreorder: false,
      })
      .onConflictDoNothing();

    console.log('Seed complete.');
    console.log('  customer: test@example.com / password123');
    console.log(`  admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } finally {
    await proxy.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
