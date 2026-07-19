import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/config/site.config';
import { ProductGrid } from '@/features/shop';
import { listStorefrontBundleProducts } from '@/server/services/bundle.service';

// Reads D1 at request time — must not be prerendered at build time
// (the CI build sandbox has no D1 tables).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bundle deals',
  description: `Shop active bundle offers at ${SITE.name}. Calm kits & squishy multi-packs — cash on delivery across Egypt.`,
  alternates: { canonical: '/bundles' },
};

export default async function BundlesPage() {
  const products = await listStorefrontBundleProducts();

  return (
    <div className="mx-auto max-w-container px-4 py-10 lg:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-accent">
        Deals
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold lg:text-4xl">
        Bundle deals
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-text-secondary">
        Products in active bundles. Add matching items to your bag — savings apply
        at checkout when the offer qualifies.
      </p>

      <div className="mt-8">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="py-16 text-center text-text-muted">
            No active bundle deals right now.{' '}
            <Link
              href="/shop"
              className="font-medium text-brand-primary underline-offset-4 hover:underline"
            >
              Browse the shop
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
