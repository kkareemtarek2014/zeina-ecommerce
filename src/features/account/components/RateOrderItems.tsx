'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star } from 'lucide-react';
import type { OrderDTO } from '@/shared/contracts/order.contract';
import { Button, useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { useSubmitReview } from '@/features/product';
import { cn } from '@/shared/utils/cn';

const reviewFormSchema = z.object({
  rating: z.number().int().min(1, 'Choose a rating').max(5),
  comment: z
    .string()
    .trim()
    .min(1, 'Please write a short review')
    .max(1000, 'Keep it under 1000 characters'),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;
type OrderItem = OrderDTO['items'][number];

interface RateOrderItemsProps {
  items: OrderItem[];
}

/**
 * Shown on delivered orders in /account/orders — soft review ask after receipt
 * (not on confirmation). Stars + text → existing POST /api/reviews.
 */
export function RateOrderItems({ items }: RateOrderItemsProps) {
  const unique = items.filter(
    (item, i, arr) =>
      arr.findIndex((x) => x.productId === item.productId) === i,
  );
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const remaining = unique.filter((i) => !submittedIds.has(i.productId));
  if (remaining.length === 0) return null;

  return (
    <div className="border-t border-border bg-brand-blush/40 px-4 py-3">
      <p className="text-sm font-medium text-text-primary">Rate your order</p>
      <p className="mt-0.5 text-xs text-text-muted">
        Your review helps others choose with confidence.
      </p>
      <ul className="mt-3 space-y-2">
        {remaining.map((item) => (
          <li key={item.productId}>
            {openProductId === item.productId ? (
              <ReviewItemForm
                productId={item.productId}
                productName={item.name}
                onCancel={() => setOpenProductId(null)}
                onSuccess={() => {
                  setSubmittedIds((prev) => new Set(prev).add(item.productId));
                  setOpenProductId(null);
                }}
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-text-secondary">
                  {item.name}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenProductId(item.productId)}
                >
                  Rate
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewItemForm({
  productId,
  productName,
  onCancel,
  onSuccess,
}: {
  productId: string;
  productName: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const submitReview = useSubmitReview();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema) as Resolver<ReviewFormValues>,
    defaultValues: { rating: 0, comment: '' },
  });
  const rating = watch('rating');

  const onSubmit = async (values: ReviewFormValues) => {
    try {
      await submitReview.mutateAsync({
        productId,
        rating: values.rating,
        comment: values.comment,
      });
      toast('Thanks for your review', 'success');
      onSuccess();
    } catch (err) {
      toast(
        err instanceof AppError ? err.message : 'Could not submit review',
        'error',
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-(--radius) border border-border bg-surface-raised p-3"
      noValidate
    >
      <p className="text-sm font-medium text-text-primary">{productName}</p>

      <div>
        <p className="mb-1.5 text-xs font-medium text-text-secondary">Rating</p>
        <div className="flex gap-1" role="group" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = rating >= value;
            return (
              <button
                key={value}
                type="button"
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                aria-pressed={rating === value}
                onClick={() =>
                  setValue('rating', value, { shouldValidate: true })
                }
                className="rounded p-0.5 text-brand-accent transition-colors hover:bg-brand-blush"
              >
                <Star
                  className={cn(
                    'size-6',
                    selected
                      ? 'fill-brand-accent text-brand-accent'
                      : 'fill-transparent text-border-strong',
                  )}
                />
              </button>
            );
          })}
        </div>
        {errors.rating ? (
          <p className="mt-1 text-xs text-status-error">
            {errors.rating.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`review-comment-${productId}`}
          className="text-xs font-medium text-text-secondary"
        >
          Your review
        </label>
        <textarea
          id={`review-comment-${productId}`}
          rows={3}
          placeholder="How was the quality, style, shipping…?"
          className={cn(
            'w-full rounded-(--radius) border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-muted',
            'focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
            errors.comment &&
              'border-status-error focus:border-status-error focus:ring-status-error/20',
          )}
          {...register('comment')}
        />
        {errors.comment ? (
          <p className="text-xs text-status-error">{errors.comment.message}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" isLoading={submitReview.isPending}>
          Submit review
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={submitReview.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
