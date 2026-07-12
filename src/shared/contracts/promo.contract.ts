import { z } from 'zod';

export const validatePromoInputSchema = z.object({
  code: z.string().trim().min(1),
  subtotal: z.number().nonnegative(),
});

export type ValidatePromoInput = z.infer<typeof validatePromoInputSchema>;

export const validatePromoResultSchema = z.object({
  valid: z.boolean(),
  discount: z.number().optional(),
  error: z.string().optional(),
});

export type ValidatePromoResult = z.infer<typeof validatePromoResultSchema>;
