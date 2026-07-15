import { useNewArrivals } from '@/features/shop';
import { ProductGridSkeleton, Skeleton } from '@/shared/components/ui';
import { ProductGrid } from '@/features/shop/components/ProductGrid';

export function NewArrivals() {
  const { data: products, isLoading } = useNewArrivals(4);

  if (isLoading) {
    return (
      <section className="mt-20 border-t border-border pt-12">
        <Skeleton className="mb-8 h-7 w-40" />
        <ProductGridSkeleton count={4} />
      </section>
    );
  }

  if (!products?.length) return null;

  return (
    <section className="mt-20 border-t border-border pt-12">
      <h2 className="mb-8 font-(family-name:--font-display) text-2xl font-semibold text-brand-primary">
        New Arrivals
      </h2>
      <ProductGrid products={products} />
    </section>
  );
}
