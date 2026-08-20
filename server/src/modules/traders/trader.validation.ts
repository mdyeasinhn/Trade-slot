import { z } from 'zod';

export const updateTraderSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  timezone: z.string().min(1).optional(),
  workDayStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'workDayStart must be HH:mm')
    .optional(),
  workDayEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'workDayEnd must be HH:mm')
    .optional(),
  jobDurationMin: z.number().int().positive().optional(),
  bufferMin: z.number().int().nonnegative().optional(),
  bookingFee: z.number().int().nonnegative().optional(),
});

export type UpdateTraderInput = z.infer<typeof updateTraderSchema>;