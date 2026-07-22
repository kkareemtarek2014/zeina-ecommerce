'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { isFeatureEnabled } from '@/config/features.config';
import { api } from '@/shared/lib/api-client';
import { BundleSavingsBadge } from './BundleSavingsBadge';

type BundleHint = {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  productIds: string[];
  products: Array<{
    id: string;
    name: string;
    image: string;
    price: number;
  }>;
  savingsEgp: number | null;
};

export function ProductBundleHints({ productId }: { productId: string }) {
  const enabled = isFeatureEnabled('bundles');
  const { data: hints = [] } = useQuery({
    queryKey: ['product-bundles', productId],
    queryFn: () =>
      api.get<BundleHint[]>(
        `/api/products/${encodeURIComponent(productId)}/bundles`,
      ),
    enabled,
  });

  if (!enabled || hints.length === 0) return null;

  return (
    <div className="space-y-3">
      {hints.map((h) => (
        <div
          key={h.id}
          className="rounded-lg border border-border bg-brand-blush/40 px-4 py-3 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-text-primary">{h.name}</p>
            {h.savingsEgp ? (
              <BundleSavingsBadge amountEgp={h.savingsEgp} />
            ) : null}
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {h.type === 'bxgy'
              ? `Buy ${String(h.config.buyQty)} get ${String(h.config.getQty)}`
              : 'Bundle set — savings apply at checkout'}
          </p>
          {h.products.length > 0 ? (
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {h.products.map((p) => (
                <li key={p.id} className="shrink-0">
                  <Link
                    href={`/product/${p.id}`}
                    className="block overflow-hidden rounded-(--radius) border border-border bg-surface-raised"
                  >
                    <Image
                      src={p.image || '/images/cat-medium.svg'}
                      alt={p.name}
                      width={64}
                      height={64}
                      className="size-16 object-cover"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <Link
            href="/bundles"
            className="mt-2 inline-block text-xs font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            View all bundle deals
          </Link>
        </div>
      ))}
    </div>
  );
}
