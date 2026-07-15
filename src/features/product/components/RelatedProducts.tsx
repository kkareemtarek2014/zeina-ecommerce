import { useRelatedProducts } from '@/features/shop';
import { ProductGridSkeleton, Skeleton } from '@/shared/components/ui';
import { ProductGrid } from '@/features/shop/components/ProductGrid';

export function RelatedProducts({
  currentId,
  category,
}: {
  currentId: string;
  category: string;
}) {
  const { data: products, isLoading } = useRelatedProducts(
    currentId,
    category,
    4,
  );

  if (isLoading) {
    return (
      <section className="mt-20 border-t border-border pt-12">
        <Skeleton className="mb-8 h-7 w-48" />
        <ProductGridSkeleton count={4} />
      </section>
    );
  }

  if (!products?.length) return null;

  return (
    <section className="mt-20 border-t border-border pt-12">
      <h2 className="mb-8 font-(family-name:--font-display) text-2xl font-semibold text-brand-primary">
        You Might Also Like
      </h2>
      <ProductGrid products={products} />
    </section>
  );
}
