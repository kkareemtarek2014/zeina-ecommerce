import { FormSkeleton } from '@/shared/components/ui';

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <FormSkeleton fields={3} />
    </div>
  );
}
