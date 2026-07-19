'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  AdminBreadcrumbs,
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
      <AdminBreadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Products', href: '/admin/products' },
          { label: 'Temu import' },
        ]}
      />
      <h1 className="mb-2 font-(family-name:--font-display) text-2xl font-semibold">
        Import from Temu
      </h1>
      <p className="mb-6 max-w-xl text-sm text-text-secondary">
        Paste a Temu product URL to create a <strong>draft</strong> for review.
        Images land in R2; publish only after you localize and set stock.
        Requires <code className="text-xs">SCRAPER_API_KEY</code> (use{' '}
        <code className="text-xs">mock</code> locally). Stop/start the scraper
        from the dashboard kill switch.
      </p>

      <form
        className="max-w-xl space-y-4"
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
          label="Temu product URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.temu.com/..."
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
  );
}
