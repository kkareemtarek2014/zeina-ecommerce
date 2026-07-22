'use client';

import { useRouter } from 'next/navigation';
import {
  AdminPageHeader,
  CategoryForm,
  useCreateAdminCategory,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminNewCategoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateAdminCategory();

  return (
    <div>
      <AdminPageHeader
        title="New category"
        subtitle="Slug is permanent. Upload an image after saving."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Categories', href: '/admin/categories' },
          { label: 'New' },
        ]}
      />
      <CategoryForm
        isLoading={createMutation.isPending}
        onSubmit={async (values) => {
          if (!values.slug) return;
          try {
            const cat = await createMutation.mutateAsync({
              slug: values.slug,
              name: values.name,
              seoDescription: values.seoDescription,
              sortOrder: values.sortOrder,
              image: values.image,
            });
            toast('Category created', 'success');
            router.push(`/admin/categories/${cat.slug}/edit`);
          } catch (err) {
            toast(
              err instanceof AppError ? err.message : 'Create failed',
              'error',
            );
          }
        }}
      />
    </div>
  );
}
