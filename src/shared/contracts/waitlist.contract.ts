import { z } from 'zod';

export const waitlistSubscribeSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export type WaitlistSubscribeInput = z.infer<typeof waitlistSubscribeSchema>;

export const waitlistStatusSchema = z.object({
  subscribed: z.boolean(),
  waitlistCount: z.number().int(),
});

export type WaitlistStatusDTO = z.infer<typeof waitlistStatusSchema>;
