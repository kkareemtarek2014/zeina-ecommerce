'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/shared/components/ui';
import type { AdminSettingsDTO } from '@/shared/contracts/admin-config.contract';

const formSchema = z.object({
  profitMargin: z.coerce
    .number()
    .min(0.2, 'Minimum 20%')
    .max(0.3, 'Maximum 30%'),
  freeShippingThreshold: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  siteName: z.string().trim().min(1),
  siteTagline: z.string().trim().min(1),
  siteUrl: z.string().trim().url('Enter a valid URL'),
});

type FormValues = z.infer<typeof formSchema>;

interface SettingsFormProps {
  initial: AdminSettingsDTO;
  onSubmit: (values: FormValues) => Promise<void>;
  isLoading?: boolean;
}

export function SettingsForm({ initial, onSubmit, isLoading }: SettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      profitMargin: initial.profitMargin,
      freeShippingThreshold: initial.freeShippingThreshold,
      lowStockThreshold: initial.lowStockThreshold,
      siteName: initial.siteName,
      siteTagline: initial.siteTagline,
      siteUrl: initial.siteUrl,
    },
  });

  return (
    <form
      className="max-w-lg space-y-4"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <Input
        label="Profit margin"
        type="number"
        step="0.01"
        min={0.2}
        max={0.3}
        error={errors.profitMargin?.message}
        {...register('profitMargin')}
      />
      <Input
        label="Free shipping threshold (EGP)"
        type="number"
        step="1"
        min={0}
        error={errors.freeShippingThreshold?.message}
        {...register('freeShippingThreshold')}
      />
      <Input
        label="Low-stock threshold"
        type="number"
        step="1"
        min={0}
        error={errors.lowStockThreshold?.message}
        {...register('lowStockThreshold')}
      />
      <Input
        label="Site name"
        error={errors.siteName?.message}
        {...register('siteName')}
      />
      <Input
        label="Site tagline"
        error={errors.siteTagline?.message}
        {...register('siteTagline')}
      />
      <Input
        label="Site URL"
        type="url"
        placeholder="https://example.com"
        error={errors.siteUrl?.message}
        {...register('siteUrl')}
      />
      <Button type="submit" isLoading={isLoading}>
        Save settings
      </Button>
    </form>
  );
}
