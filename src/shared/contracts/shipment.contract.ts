import { z } from 'zod';
import { orderStatusSchema } from '@/shared/contracts/order.contract';

export const shipmentDtoSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  provider: z.literal('bosta'),
  bostaDeliveryId: z.string().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  trackingUrl: z.string().nullable().optional(),
  bostaState: z.string().nullable().optional(),
  mappedStatus: orderStatusSchema.nullable().optional(),
  codAmount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ShipmentDTO = z.infer<typeof shipmentDtoSchema>;

import { PaginationQuerySchema } from './common.contract';

export const adminShipmentListQuerySchema = PaginationQuerySchema.extend({
  q: z.string().optional(),
});

