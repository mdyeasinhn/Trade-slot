import { z } from 'zod';

export const createPaymentSchema = z.object({
  bookingId: z.string().min(1),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;