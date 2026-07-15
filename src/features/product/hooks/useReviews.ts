'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateReviewInput } from '@/shared/contracts/review.contract';
import { reviewsService } from '../services/reviews.service';

export const reviewKeys = {
  byProduct: (productId: string) => ['reviews', productId] as const,
};

export function useReviews(productId: string) {
  return useQuery({
    queryKey: reviewKeys.byProduct(productId),
    queryFn: () => reviewsService.list(productId),
    enabled: Boolean(productId),
    retry: false,
  });
}

/** Auth-only create — used by account “Rate your order” UI. */
export function useCreateReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateReviewInput, 'productId'>) =>
      reviewsService.create({ ...input, productId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reviewKeys.byProduct(productId) });
    },
  });
}

/** Submit a review with productId in the payload (multi-item orders). */
export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewsService.create(input),
    onSuccess: (_data, input) => {
      void qc.invalidateQueries({
        queryKey: reviewKeys.byProduct(input.productId),
      });
    },
  });
}
