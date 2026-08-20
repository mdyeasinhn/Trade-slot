import { z } from 'zod';

export const upsertWorkAreaSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  area: z.string().min(1, 'area is required'),
});

export const listWorkAreaSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

export type UpsertWorkAreaInput = z.infer<typeof upsertWorkAreaSchema>;