'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  AdminPageHeader,
  useAdminCategories,
} from '@/features/admin';
import { Button, Input, Select, useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import type { AdminProductDTO } from '@/shared/contracts/admin-catalog.contract';
import { api } from '@/shared/lib/api-client';

export default function AdminTemuImportPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { data: categories = [] } = useAdminCategories();
  const [url, setUrl] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [fulfilmentType, setFulfilmentType] = useState<
    'local_stock' | 'dropship'
  >('local_stock');

  const importMutation = useMutation({
    mutationFn: (body: {
      url: string;
      categorySlug?: string;
      fulfilmentType?: 'local_stock' | 'dropship';
    }) => api.post<AdminProductDTO>('/api/admin/import/temu', body),
  });

  return (
    <div>
      <AdminPageHeader
        title="Import from Alibaba / Temu"
        subtitle="Paste a product URL to create a draft for review."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Products', href: '/admin/products' },
          { label: 'Import' },
        ]}
      />

      <div className="mt-6 max-w-xl rounded-lg border border-border bg-surface-raised p-5">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void importMutation
              .mutateAsync({
                url: url.trim(),
                categorySlug: categorySlug || undefined,
                fulfilmentType,
              })
              .then((product) => {
                toast('Draft imported — review before publishing', 'success');
                router.push(`/admin/products/${product.id}/edit`);
              })
              .catch((err: unknown) =>
                toast(
                  err instanceof AppError ? err.message : 'Import failed',
                  'error',
                ),
              );
          }}
        >
          <Input
            label="Product URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
          />
          <Select
            label="Category"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
          >
            <option value="">Default (medium or first)</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Fulfilment type"
            value={fulfilmentType}
            onChange={(e) =>
              setFulfilmentType(e.target.value as 'local_stock' | 'dropship')
            }
          >
            <option value="local_stock">Local stock (micro-warehouse)</option>
            <option value="dropship">Dropship sourcing (timeline only)</option>
          </Select>
          <Button type="submit" isLoading={importMutation.isPending}>
            Import as draft
          </Button>
        </form>
      </div>
    </div>
  );
}
