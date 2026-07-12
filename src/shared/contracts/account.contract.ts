import { z } from 'zod';

const egyptianPhone = /^01[0125][0-9]{8}$/;

export const profileDtoSchema = z.object({
  fullName: z.string(),
  phone: z.string().optional(),
  email: z.string().email(),
});

export type ProfileDTO = z.infer<typeof profileDtoSchema>;

export const updateProfileInputSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().regex(egyptianPhone).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const savedAddressSchema = z.object({
  id: z.string(),
  label: z.string(),
  governorate: z.string(),
  city: z.string(),
  street: z.string(),
});

export type SavedAddressDTO = z.infer<typeof savedAddressSchema>;

export const createAddressInputSchema = z.object({
  label: z.string().trim().min(1),
  governorate: z.string().min(1),
  city: z.string().trim().min(2),
  street: z.string().trim().min(5),
});

export type CreateAddressInput = z.infer<typeof createAddressInputSchema>;

export const favoritesDtoSchema = z.object({
  ids: z.array(z.string()),
});

export type FavoritesDTO = z.infer<typeof favoritesDtoSchema>;

export const updateFavoritesInputSchema = z.object({
  ids: z.array(z.string()),
});

export type UpdateFavoritesInput = z.infer<typeof updateFavoritesInputSchema>;

export const walletTransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['credit', 'debit']),
  amount: z.number().int(),
  description: z.string(),
  createdAt: z.string(),
});

export const walletDtoSchema = z.object({
  balance: z.number().int(),
  transactions: z.array(walletTransactionSchema),
});

export type WalletDTO = z.infer<typeof walletDtoSchema>;
