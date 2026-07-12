import { z } from 'zod';

export const reviewItemSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  helpful: z.number().int(),
  createdAt: z.string(),
});

export const reviewSummarySchema = z.object({
  average: z.number(),
  count: z.number().int(),
  breakdown: z.record(z.string(), z.number().int()),
});

export const reviewsResponseSchema = z.object({
  summary: reviewSummarySchema,
  items: z.array(reviewItemSchema),
});

export type ReviewsResponse = z.infer<typeof reviewsResponseSchema>;

export const createReviewInputSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1),
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
