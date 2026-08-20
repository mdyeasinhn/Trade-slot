import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    name: z.string().min(1),
    phone: z.string().optional(),
    businessName: z.string().min(1).optional(),
  })
  .refine((v) => v.businessName || v.phone, {
    message: 'A business name or phone is required to create a trader.',
    path: ['businessName'],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;