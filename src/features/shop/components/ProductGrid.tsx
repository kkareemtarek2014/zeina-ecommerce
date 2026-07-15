'use client';

import type { CSSProperties } from 'react';
import type { Product } from '@/shared/types/product.types';
import { ProductGridSkeleton } from '@/shared/components/ui';
import { ProductCard } from './ProductCard';

export function ProductGrid({
  products,
  isLoading,
}: {
  products: Product[] | undefined;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (!products || products.length === 0) {
    return (
      <p className="py-16 text-center text-text-muted">
        No products found in this category yet — check back soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="animate-fade-up stagger"
          style={{ '--stagger-i': index } as CSSProperties}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
