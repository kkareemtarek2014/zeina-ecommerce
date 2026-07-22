import { FormSkeleton, Skeleton } from '@/shared/components/ui';

export default function AdminFormLoading() {
  return (
    <div className="animate-fade-up" aria-busy="true" aria-label="Loading form">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <FormSkeleton fields={6} className="max-w-2xl" />
    </div>
  );
}
