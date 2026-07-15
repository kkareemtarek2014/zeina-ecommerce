import { z } from 'zod';

export const wishlistAlertTypeSchema = z.enum(['price_drop', 'restock']);
export type WishlistAlertType = z.infer<typeof wishlistAlertTypeSchema>;

export const wishlistAlertToggleSchema = z.object({
  productId: z.string().min(1),
  alertType: wishlistAlertTypeSchema,
  enabled: z.boolean(),
});

export type WishlistAlertToggleInput = z.infer<typeof wishlistAlertToggleSchema>;

export const wishlistAlertDtoSchema = z.object({
  productId: z.string(),
  alertType: wishlistAlertTypeSchema,
  enabled: z.boolean(),
});

export type WishlistAlertDTO = z.infer<typeof wishlistAlertDtoSchema>;
