import { z } from 'zod';
import {
  orderDtoSchema,
  orderStatusSchema,
  type OrderDTO,
} from '@/shared/contracts/order.contract';
import { savedAddressSchema } from '@/shared/contracts/account.contract';
import { userRoleSchema } from '@/shared/contracts/auth.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';

export { type Paginated };

export const adminOrderDtoSchema = orderDtoSchema.extend({
  userId: z.string().nullable(),
});

export type AdminOrderDTO = z.infer<typeof adminOrderDtoSchema>;

export const adminOrderStatusPatchSchema = z.object({
  status: orderStatusSchema,
});

export type AdminOrderStatusPatch = z.infer<typeof adminOrderStatusPatchSchema>;

export const adminOrderBulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
  status: orderStatusSchema,
});

export type AdminOrderBulkStatus = z.infer<typeof adminOrderBulkStatusSchema>;


export const adminUserDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  role: userRoleSchema,
  createdAt: z.string(),
  ordersCount: z.number().int(),
});

export type AdminUserDTO = z.infer<typeof adminUserDtoSchema>;

export const adminUserFavoriteSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().optional(),
});

export const adminUserDetailDtoSchema = adminUserDtoSchema.extend({
  stats: z.object({
    ordersCount: z.number().int(),
    totalSpent: z.number().int(),
    lastOrderAt: z.string().nullable(),
  }),
  recentOrders: z.array(adminOrderDtoSchema),
  favorites: z.array(adminUserFavoriteSchema),
  addresses: z.array(savedAddressSchema),
});

export type AdminUserDetailDTO = z.infer<typeof adminUserDetailDtoSchema>;

const egyptianPhone = /^01[0125][0-9]{8}$/;

export const adminUserWriteSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: z
    .string()
    .trim()
    .regex(egyptianPhone, 'Enter a valid Egyptian mobile number')
    .optional()
    .nullable(),
  role: userRoleSchema.optional(),
});

export type AdminUserWrite = z.infer<typeof adminUserWriteSchema>;

/** Forward flow (one step). Cancel handled separately. */
export const ORDER_STATUS_FLOW = [
  'placed',
  'confirmed',
  'sourced',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const;

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export function allowedNextStatuses(current: OrderStatus): OrderStatus[] {
  if (current === 'delivered' || current === 'cancelled') return [];
  const idx = ORDER_STATUS_FLOW.indexOf(
    current as (typeof ORDER_STATUS_FLOW)[number],
  );
  const next: OrderStatus[] = [];
  if (idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1) {
    next.push(ORDER_STATUS_FLOW[idx + 1]!);
  }
  next.push('cancelled');
  return next;
}

export function isOrderStatusTransitionAllowed(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return true;
  return allowedNextStatuses(from).includes(to);
}

export type { OrderDTO };
