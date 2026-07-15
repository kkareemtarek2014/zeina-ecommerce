'use client';

import { useMemo } from 'react';
import type { Product } from '@/shared/types/product.types';
import { useFeaturedProducts, useNewArrivals } from '@/features/shop';
import { useCartStore } from '../store/cart.store';

/** Prefer products that close free-shipping when the gap is small (≤ 300 EGP). */
const GAP_CLOSE_MAX_EGP = 300;

/**
 * Products to suggest inside the cart. Sourced from featured products (falls
 * back to new arrivals), filtered to in-stock items that are NOT already in
 * the cart. When `remainingForFree` is 0–300 EGP, prefer items priced ≤ gap.
 */
export function useCartRecommendations(
  limit = 8,
  remainingForFree?: number,
): {
  products: Product[];
  isLoading: boolean;
  gapAware: boolean;
} {
  const featured = useFeaturedProducts();
  const newArrivals = useNewArrivals(limit + 4);
  const cartItems = useCartStore((s) => s.items);

  const featuredData = featured.data;
  const newArrivalsData = newArrivals.data;

  const gapAware =
    remainingForFree != null &&
    remainingForFree > 0 &&
    remainingForFree <= GAP_CLOSE_MAX_EGP;

  const products = useMemo(() => {
    const source =
      featuredData && featuredData.length > 0
        ? featuredData
        : (newArrivalsData ?? []);
    const inCart = new Set(cartItems.map((i) => i.productId));
    const eligible = source.filter((p) => p.inStock && !inCart.has(p.id));

    if (!gapAware || remainingForFree == null) {
      return eligible.slice(0, limit);
    }

    const withinGap = eligible.filter((p) => p.price <= remainingForFree);
    const rest = eligible.filter((p) => p.price > remainingForFree);
    return [...withinGap, ...rest].slice(0, limit);
  }, [
    featuredData,
    newArrivalsData,
    cartItems,
    limit,
    gapAware,
    remainingForFree,
  ]);

  return {
    products,
    isLoading: featured.isLoading && newArrivals.isLoading,
    gapAware,
  };
}
