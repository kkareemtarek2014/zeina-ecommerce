import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'new_order',
  'low_stock',
  'payment_failed',
  'order_reminder',
  'daily_summary',
]);

export const adminNotificationDtoSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  entity: z.string(),
  entityId: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
  href: z.string().optional(),
});

export type AdminNotificationDTO = z.infer<typeof adminNotificationDtoSchema>;

export const adminActivityItemSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string().nullable().optional(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string(),
  summary: z.string(),
  createdAt: z.string(),
  href: z.string().optional(),
});

export type AdminActivityItem = z.infer<typeof adminActivityItemSchema>;

export const adminAuditLogDtoSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string().nullable().optional(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string(),
  meta: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.string(),
});

export type AdminAuditLogDTO = z.infer<typeof adminAuditLogDtoSchema>;

/** Re-export timeline types for admin consumers (canonical: order.contract). */
export {
  orderTimelineEntrySchema,
  orderTimelineActorSchema,
  type OrderTimelineEntry,
} from '@/shared/contracts/order.contract';
