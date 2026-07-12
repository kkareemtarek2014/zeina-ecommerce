import { z } from 'zod';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from '@/features/auth/schema/auth.schema';

export { forgotPasswordSchema, loginSchema, registerSchema };

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  role: z.enum(['customer', 'admin']),
});

export type UserDTO = z.infer<typeof userDtoSchema>;
