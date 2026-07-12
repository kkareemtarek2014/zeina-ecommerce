import { z } from 'zod';

const egyptianPhone = /^01[0125][0-9]{8}$/;

export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(3),
  phone: z.string().trim().regex(egyptianPhone),
  governorate: z.string().min(1),
  city: z.string().trim().min(2),
  street: z.string().trim().min(5),
  notes: z.string().trim().max(300).optional(),
});

export const createOrderInputSchema = z.object({
  items: z.array(orderItemInputSchema).min(1),
  address: shippingAddressSchema,
  paymentMethod: z.enum(['cod', 'card', 'wallet']),
  promoCode: z.string().optional(),
  note: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const orderItemDtoSchema = z.object({
  productId: z.string(),
  name: z.string(),
  image: z.string(),
  unitPrice: z.number().int(),
  quantity: z.number().int(),
});

export const orderStatusSchema = z.enum([
  'placed',
  'confirmed',
  'sourced',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);

export const orderDtoSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  status: orderStatusSchema,
  items: z.array(orderItemDtoSchema),
  address: shippingAddressSchema,
  paymentMethod: z.enum(['cod', 'card', 'wallet']),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
  subtotal: z.number().int(),
  discount: z.number().int(),
  shipping: z.number().int(),
  total: z.number().int(),
  promoCode: z.string().optional(),
  note: z.string().optional(),
  tracking: z
    .object({
      number: z.string(),
      url: z.string(),
      status: orderStatusSchema,
    })
    .optional(),
});

export type OrderDTO = z.infer<typeof orderDtoSchema>;
