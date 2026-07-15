'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Search } from 'lucide-react';
import { CATEGORIES } from '@/shared/data/categories.data';
import { useProducts } from '../hooks/useProducts';
import {
  sortProducts,
  DEFAULT_SORT,
  parseSortKey,
  type SortKey,
} from '../utils/sortProducts';
import { CategoryPills } from './CategoryPills';
import { ProductGrid } from './ProductGrid';
import { ProductSort } from './ProductSort';

export function ShopView({ category }: { category?: string }) {
  const { data, isLoading } = useProducts(category);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const sortBy = parseSortKey(searchParams.get('sort'));

  const categoryName = category
    ? (CATEGORIES.find((c) => c.slug === category)?.name ?? 'Shop')
    : 'All Products';

  function setSortBy(next: SortKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_SORT) params.delete('sort');
    else params.set('sort', next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const visibleProducts = useMemo(() => {
    if (!data) return [];
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? data.filter((product) => product.name.toLowerCase().includes(query))
      : data;
    return sortProducts(filtered, sortBy);
  }, [data, searchQuery, sortBy]);

  return (
    <div className="mx-auto max-w-container px-4 py-10 lg:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-accent">
        Shop
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold lg:text-4xl">
        {categoryName}
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        <CategoryPills active={category} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-(--radius) border border-border bg-surface-raised pl-9 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-auto">
            <span className="hidden shrink-0 text-sm text-text-secondary sm:inline">
              Sort by
            </span>
            <ProductSort
              value={sortBy}
              onChange={setSortBy}
              className="w-full sm:w-52"
            />
          </div>
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
        <ProductGrid products={visibleProducts} isLoading={isLoading} />
      </div>
    </div>
  );
}
