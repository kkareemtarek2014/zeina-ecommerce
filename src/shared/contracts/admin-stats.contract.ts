import { z } from 'zod';
import { orderStatusSchema } from '@/shared/contracts/order.contract';
import { adminOrderDtoSchema } from '@/shared/contracts/admin-ops.contract';
import { adminProductDtoSchema } from '@/shared/contracts/admin-catalog.contract';

export const adminStatsDtoSchema = z.object({
  revenueTotal: z.number().int(),
  ordersCount: z.number().int(),
  productsCount: z.number().int(),
  usersCount: z.number().int(),
  ordersByStatus: z.record(orderStatusSchema, z.number().int()),
  recentOrders: z.array(adminOrderDtoSchema),
  latestProducts: z.array(adminProductDtoSchema),
  lowStockProducts: z.array(adminProductDtoSchema),
  salesByDay: z.array(
    z.object({
      date: z.string(),
      total: z.number().int(),
    }),
  ),
});

export type AdminStatsDTO = z.infer<typeof adminStatsDtoSchema>;
