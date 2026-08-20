import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be HH:mm');

export const createBookingSchema = z.object({
  traderId: z.string().min(1),
  date: dateSchema,
  startTime: timeSchema,
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  serviceDescription: z.string().optional(),
  conversationId: z.string().optional(),
});

export const listBookingsQuerySchema = z.object({
  date: dateSchema.optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PAYMENT_PENDING', 'PAID', 'COMPLETED', 'CANCELLED']),
  cancelledReason: z.string().optional(),
});

export const availabilityQuerySchema = z.object({
  traderId: z.string().min(1),
  date: dateSchema,
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;