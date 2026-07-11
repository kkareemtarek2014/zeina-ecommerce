'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Search } from 'lucide-react';
import { CATEGORIES } from '@/shared/data/categories.data';
import { useProducts } from '../hooks/useProducts';
import { CategoryPills } from './CategoryPills';
import { ProductGrid } from './ProductGrid';

export function ShopView({ category }: { category?: string }) {
  const { data, isLoading } = useProducts(category);
  const [searchQuery, setSearchQuery] = useState('');
  
  const categoryName = category
    ? (CATEGORIES.find((c) => c.slug === category)?.name ?? 'Shop')
    : 'All Products';

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((product) => product.name.toLowerCase().includes(query));
  }, [data, searchQuery]);

  return (
    <div className="mx-auto max-w-container px-4 py-10 lg:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-accent">
        Shop
      </p>
      <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-semibold lg:text-4xl">
        {categoryName}
      </h1>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryPills active={category} />
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-(--radius) border border-border bg-surface-raised pl-9 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>

      {category === 'bride' && (
        <Link
          href="/bride/custom"
          className="mt-6 flex items-center gap-3 rounded-(--radius) border border-brand-primary/30 bg-brand-blush/40 px-5 py-4 transition-colors hover:bg-brand-blush"
        >
          <Sparkles className="size-5 shrink-0 text-brand-primary" />
          <span className="text-sm text-text-secondary">
            Looking for something custom for your wedding?{' '}
            <span className="font-medium text-brand-primary">
              Send us a photo — we reply within 2 days.
            </span>
          </span>
        </Link>
      )}

      <div className="mt-8">
        <ProductGrid products={filteredData} isLoading={isLoading} />
      </div>
    </div>
  );
}
