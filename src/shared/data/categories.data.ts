import type { Category } from '@/shared/types/product.types';

/**
 * Sqoosh sells ONE product type — squishy stress toys — in three sizes.
 * Size is the only category axis; themes (food/animal/glow/…) are tags.
 * See docs/brand/catalog-categories-sourcing.md.
 */
export const CATEGORIES: Category[] = [
  {
    slug: 'small',
    name: 'Small Squishies',
    image: '/images/cat-small.svg',
    seoDescription:
      'Small squishy stress toys in Egypt (under 7 cm) — pocket squishies and keychains for calm on the go. Squeeze away everyday stress anywhere. Cash on delivery nationwide.',
  },
  {
    slug: 'medium',
    name: 'Medium Squishies',
    image: '/images/cat-medium.svg',
    seoDescription:
      'Medium squishy stress toys in Egypt (7–14 cm) — the classic hand-size stress squishy for your desk. Slow-rising, satisfying, made for daily de-stress. Cash on delivery nationwide.',
  },
  {
    slug: 'large',
    name: 'Large Squishies',
    image: '/images/cat-large.svg',
    seoDescription:
      'Jumbo squishy stress toys in Egypt (15 cm+) — big slow-rising squishies for the deepest, most relaxing squeeze. Perfect calm-down companions and gifts. Cash on delivery nationwide.',
  },
];
