'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell, Heart } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { useProducts } from '@/features/shop';
import { formatEGP } from '@/shared/utils/price';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useFavoritesStore } from '../store/favorites.store';
import { WishlistAlertControls } from './WishlistAlertControls';
import { useWishlistAlerts } from '../hooks/useWishlistAlerts';

export function FavoritesGrid() {
  const mounted = useHydrated();
  const ids = useFavoritesStore((s) => s.ids);
  const { data: products, isLoading } = useProducts();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: alerts = [] } = useWishlistAlerts(
    Boolean(mounted && isAuthenticated && ids.length > 0),
  );

  if (!mounted) return null;

  const favorites = products?.filter((p) => ids.includes(p.id));

  if (!isLoading && (!favorites || favorites.length === 0)) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Heart className="size-12 text-border-strong" />
        <p className="text-sm text-text-secondary">
          No favorites yet — tap the heart on any product to save it here.
        </p>
        <Link href="/shop">
          <Button variant="outline">Browse products</Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !favorites) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((product) => {
        const productAlerts = alerts.filter(
          (a) => a.productId === product.id && a.enabled,
        );
        return (
          <li
            key={product.id}
            className="overflow-hidden rounded-lg border border-border bg-surface-raised"
          >
            <Link href={`/product/${product.id}`} className="block">
              <div className="relative aspect-square bg-brand-blush">
                <Image
                  src={product.images[0] ?? ''}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium text-text-primary">
                  {product.name}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-primary">
                  {formatEGP(product.price)}
                </p>
                {productAlerts.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {productAlerts.map((a) => (
                      <Badge key={a.alertType} tone="accent" className="gap-1">
                        <Bell className="size-3" aria-hidden />
                        {a.alertType === 'price_drop' ? 'Price drop' : 'Restock'}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
            {isAuthenticated ? (
              <div className="border-t border-border px-3 py-2">
                <WishlistAlertControls productId={product.id} favorited />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
