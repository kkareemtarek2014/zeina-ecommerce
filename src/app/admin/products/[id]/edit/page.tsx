'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import {
  AdminPageHeader,
  ProductForm,
  StockPanel,
  useAdminCategories,
  useAdminProduct,
  useDuplicateAdminProduct,
  useUpdateAdminProduct,
} from '@/features/admin';
import { Button, useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data: product, isLoading, isError } = useAdminProduct(id);
  const { data: categories = [] } = useAdminCategories();
  const updateMutation = useUpdateAdminProduct(id);
  const duplicateMutation = useDuplicateAdminProduct();

  return (
    <div>
      <AdminPageHeader
        title="Edit product"
        subtitle="Cost stays admin-only; sell price is derived from margin."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Products', href: '/admin/products' },
          { label: product?.name ?? 'Edit' },
        ]}
        action={
          product ? (
            <Button
              type="button"
              variant="outline"
              isLoading={duplicateMutation.isPending}
              onClick={async () => {
                try {
                  const dup = await duplicateMutation.mutateAsync(product.id);
                  toast('Product duplicated as draft', 'success');
                  router.push(`/admin/products/${dup.id}/edit`);
                } catch (err) {
                  toast(
                    err instanceof AppError ? err.message : 'Duplicate failed',
                    'error',
                  );
                }
              }}
            >
              <Copy className="size-4" />
              Duplicate product
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : isError || !product ? (
        <p className="text-sm text-status-error">Product not found.</p>
      ) : (
        <>
          <ProductForm
            key={product.id}
            categories={categories}
            initial={product}
            isLoading={updateMutation.isPending}
            onSubmit={async (values) => {
              try {
                await updateMutation.mutateAsync({
                  ...values,
                  images: values.images,
                });
                toast('Product saved', 'success');
                router.push('/admin/products');
              } catch (err) {
                toast(
                  err instanceof AppError ? err.message : 'Save failed',
                  'error',
                );
              }
            }}
          />
          <StockPanel product={product} />
        </>
      )}
    </div>
  );
}
