import { Skeleton } from '@/shared/components/ui';

/**
 * Route-level skeleton for `/admin` (Today dashboard).
 * Matches Phase 4 layout: action strip → stat chips → chart+funnel → tabs.
 */
export default function AdminDashboardLoading() {
  return (
    <div className="animate-fade-up" aria-busy="true" aria-label="Loading Today dashboard">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>

        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
