import { cn } from '@/shared/utils/cn';
import { Skeleton, SkeletonImage, SkeletonText } from './Skeleton';

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-surface-raised',
        className,
      )}
      aria-hidden
    >
      <SkeletonImage aspect="square" className="rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6',
        className,
      )}
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('grid gap-10 lg:grid-cols-2', className)}
      aria-busy="true"
      aria-label="Loading product"
    >
      <SkeletonImage aspect="square" />
      <div className="space-y-4 pt-2 lg:pt-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-7 w-28" />
        <SkeletonText lines={4} className="pt-2" />
        <div className="flex items-center gap-3 pt-4">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 flex-1" />
        </div>
        <div className="space-y-2 border-t border-border pt-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  );
}

export function SectionHeaderSkeleton({
  centered,
  className,
}: {
  centered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'space-y-2',
        centered && 'mx-auto max-w-xl text-center',
        className,
      )}
      aria-hidden
    >
      <Skeleton className={cn('h-3 w-20', centered && 'mx-auto')} />
      <Skeleton className={cn('h-8 w-64 max-w-full', centered && 'mx-auto')} />
      <Skeleton className={cn('h-4 w-80 max-w-full', centered && 'mx-auto')} />
    </div>
  );
}

export function CategoryPillsSkeleton({
  count = 7,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('no-scrollbar flex gap-2 overflow-hidden pb-1', className)}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-9 shrink-0 rounded-full"
          style={{ width: `${56 + ((i * 17) % 40)}px` }}
        />
      ))}
    </div>
  );
}

export function HeroSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'relative overflow-hidden bg-linear-to-br from-brand-blush via-surface to-surface',
        className,
      )}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="relative mx-auto grid max-w-container items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div className="max-w-xl space-y-5">
          <Skeleton className="h-8 w-48 rounded-full" />
          <Skeleton className="h-12 w-full sm:h-14" />
          <Skeleton className="h-12 w-4/5 sm:h-14" />
          <SkeletonText lines={3} />
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-13 w-44" />
            <Skeleton className="h-13 w-40" />
          </div>
        </div>
        <SkeletonImage aspect="hero" className="shadow-lg" />
      </div>
    </section>
  );
}

export function HomePageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading homepage">
      <HeroSkeleton />
      <div className="mx-auto max-w-container space-y-16 px-4 py-14 lg:px-8">
        <div>
          <SectionHeaderSkeleton className="mb-8" />
          <ProductGridSkeleton count={4} />
        </div>
        <div>
          <SectionHeaderSkeleton className="mb-8" centered />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-4/3 rounded-lg" />
            ))}
          </div>
        </div>
        <div>
          <SectionHeaderSkeleton className="mb-8" />
          <ProductGridSkeleton count={4} />
        </div>
      </div>
    </div>
  );
}

export function ShopPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-container px-4 py-10 lg:px-8"
      aria-busy="true"
      aria-label="Loading shop"
    >
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-9 w-48 lg:h-10" />
      <div className="mt-6 space-y-4">
        <CategoryPillsSkeleton />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-11 w-full sm:max-w-xs" />
          <Skeleton className="h-11 w-full sm:w-52" />
        </div>
      </div>
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="mx-auto max-w-container space-y-16 px-4 py-10 lg:px-8">
      <ProductDetailSkeleton />
      <div>
        <Skeleton className="mb-6 h-7 w-48" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}

export function FormSkeleton({
  fields = 5,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-5', className)} aria-busy="true" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="mt-2 h-12 w-full" />
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-container px-4 py-10 lg:px-8"
      aria-busy="true"
      aria-label="Loading bag"
    >
      <Skeleton className="h-9 w-40 lg:h-10" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-border py-4">
              <Skeleton className="size-24 shrink-0 rounded-(--radius)" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </div>
        <aside className="h-fit space-y-4 rounded-lg border border-border bg-surface-raised p-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-12 w-full" />
        </aside>
      </div>
    </div>
  );
}

export function CartDrawerSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading bag">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-16 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CheckoutBodySkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('grid gap-10 lg:grid-cols-[1fr_380px]', className)}
      aria-busy="true"
      aria-label="Loading checkout"
    >
      <div className="space-y-8">
        <div>
          <Skeleton className="mb-4 h-6 w-40" />
          <FormSkeleton fields={5} />
        </div>
        <div className="space-y-3">
          <Skeleton className="mb-2 h-6 w-28" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
      <aside className="h-fit space-y-4 rounded-lg border border-border bg-surface-raised p-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-2 h-12 w-full" />
      </aside>
    </div>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <div className="mx-auto max-w-container px-4 py-10 lg:px-8">
      <Skeleton className="h-9 w-40 lg:h-10" />
      <CheckoutBodySkeleton className="mt-8" />
    </div>
  );
}

export function AccountListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-3', className)}
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border bg-surface-raised p-4"
        >
          <Skeleton className="size-10 shrink-0" circle />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="hidden h-8 w-20 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-container px-4 py-10 lg:px-8"
      aria-busy="true"
      aria-label="Loading account"
    >
      <Skeleton className="h-9 w-44 lg:h-10" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <div className="hidden space-y-2 lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <AccountListSkeleton />
      </div>
    </div>
  );
}

export function OrderBodySkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('mx-auto max-w-3xl space-y-8', className)}
      aria-busy="true"
      aria-label="Loading order"
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 flex-1 rounded-(--radius)" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="size-20 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

export function OrderPageSkeleton() {
  return (
    <div className="mx-auto max-w-container px-4 py-12 lg:px-8">
      <OrderBodySkeleton />
    </div>
  );
}

export function ReviewsSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn('mt-12 border-t border-border pt-8', className)}
      aria-busy="true"
      aria-label="Loading reviews"
    >
      <Skeleton className="h-7 w-48" />
      <div className="mt-6 space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 border-b border-border pb-5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SearchResultsSkeleton({
  count = 5,
}: {
  count?: number;
}) {
  return (
    <ul className="space-y-1" aria-busy="true" aria-label="Loading search results">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-(--radius) p-2">
          <Skeleton className="size-12 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-14 shrink-0" />
        </li>
      ))}
    </ul>
  );
}
