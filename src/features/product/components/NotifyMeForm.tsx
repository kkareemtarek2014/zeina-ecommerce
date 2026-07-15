'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react';
import { Button, Input } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { api } from '@/shared/lib/api-client';
import { waitlistSubscribeSchema } from '@/shared/contracts/waitlist.contract';

type FormValues = z.infer<typeof waitlistSubscribeSchema>;

interface NotifyMeFormProps {
  productId: string;
}

/** Guest-friendly back-in-stock email signup (honest scarcity). */
export function NotifyMeForm({ productId }: NotifyMeFormProps) {
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(waitlistSubscribeSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await api.post(`/api/products/${encodeURIComponent(productId)}/waitlist`, values);
      setDone(true);
    } catch (err) {
      setFormError(
        err instanceof AppError ? err.message : 'Could not subscribe — try again',
      );
    }
  };

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-(--radius) bg-status-success/10 px-4 py-3 text-sm text-status-success">
        <Check className="size-4 shrink-0" aria-hidden />
        We’ll let you know when it’s back ✓
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-lg border border-border bg-brand-blush/50 p-4"
      noValidate
    >
      <div>
        <p className="text-sm font-medium text-text-primary">Sold out</p>
        <p className="mt-0.5 text-xs text-text-muted">
          Leave your email and we’ll notify you when it’s back in stock.
        </p>
      </div>
      {formError ? (
        <p className="text-xs text-status-error">{formError}</p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
        <Button
          type="submit"
          className="sm:mt-7"
          isLoading={isSubmitting}
        >
          Notify me
        </Button>
      </div>
    </form>
  );
}
