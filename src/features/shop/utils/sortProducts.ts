import type { Product } from '@/shared/types/product.types';

export type SortKey =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'best-selling';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'best-selling', label: 'Best Selling' },
];

export const DEFAULT_SORT: SortKey = 'featured';

const SORT_KEYS = new Set<string>(SORT_OPTIONS.map((o) => o.value));

/** Parse `?sort=` from the URL; unknown values fall back to featured. */
export function parseSortKey(raw: string | null | undefined): SortKey {
  if (raw && SORT_KEYS.has(raw)) return raw as SortKey;
  return DEFAULT_SORT;
}

const isBestSeller = (p: Product) => (p.tags?.includes('best seller') ? 1 : 0);

/**
 * Pure product sorter. Sorts on the public sell `price` from ProductDTO.
 * Returns a new array — never mutates the input.
 */
export function sortProducts(products: Product[], sortBy: SortKey): Product[] {
  const list = [...products];

  switch (sortBy) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);
    case 'newest':
      return list.sort((a, b) =>
        b.id.localeCompare(a.id, undefined, { numeric: true }),
      );
    case 'best-selling':
      return list.sort((a, b) => isBestSeller(b) - isBestSeller(a));
    case 'featured':
    default:
      return list;
  }
}
