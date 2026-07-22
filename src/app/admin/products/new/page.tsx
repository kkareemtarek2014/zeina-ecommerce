'use client';

import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  ProductForm,
  useAdminCategories,
  useCreateAdminProduct,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminNewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: categories = [], isLoading } = useAdminCategories();
  const createMutation = useCreateAdminProduct();

  return (
    <div>
      <AdminPageHeader
        title="New product"
        subtitle="Creates as draft. Publish when ready. Upload images after saving."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Products', href: '/admin/products' },
          { label: 'New' },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading categories…</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-status-error">
          Create a category before adding products.
        </p>
      ) : (
        <ProductForm
          categories={categories}
          isLoading={createMutation.isPending}
          onSubmit={async (values) => {
            try {
              const product = await createMutation.mutateAsync({
                ...values,
                images: values.images,
              });
              toast('Product created', 'success');
              router.push(`/admin/products/${product.id}/edit`);
            } catch (err) {
              toast(
                err instanceof AppError ? err.message : 'Create failed',
                'error',
              );
            }
          }}
        />
      )}
    </div>
  );
}
