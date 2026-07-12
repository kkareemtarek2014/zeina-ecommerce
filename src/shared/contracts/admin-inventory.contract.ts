import { z } from 'zod';

export const inventoryReasonSchema = z.enum([
  'restock',
  'sale',
  'adjustment',
  'return',
  'reservation',
  'release',
]);

export type InventoryReason = z.infer<typeof inventoryReasonSchema>;

export const inventoryMovementDtoSchema = z.object({
  id: z.string(),
  productId: z.string(),
  oldQty: z.number().int(),
  newQty: z.number().int(),
  delta: z.number().int(),
  reason: inventoryReasonSchema,
  orderId: z.string().nullable().optional(),
  actorId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type InventoryMovementDTO = z.infer<typeof inventoryMovementDtoSchema>;

export const adminStockAdjustSchema = z.object({
  delta: z.number().int().refine((n) => n !== 0, 'Delta must be non-zero'),
  reason: z.enum(['restock', 'adjustment', 'return']),
  note: z.string().trim().max(500).optional().nullable(),
});

export type AdminStockAdjust = z.infer<typeof adminStockAdjustSchema>;
