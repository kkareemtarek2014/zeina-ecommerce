import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SITE } from '@/config/site.config';
import { ShopView } from '@/features/shop/components/ShopView';
import { ShopPageSkeleton } from '@/shared/components/ui';

export const metadata: Metadata = {
  title: 'Shop Squishy Stress Toys',
  description: `Browse all squishies at ${SITE.name} — small, medium and jumbo slow-rising stress toys for everyday calm. Cash on delivery across Egypt.`,
  alternates: { canonical: '/shop' },
};

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopPageSkeleton />}>
      <ShopView />
    </Suspense>
  );
}
