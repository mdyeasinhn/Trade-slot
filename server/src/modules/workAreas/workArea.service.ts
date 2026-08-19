import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/errors';
import { parseDate } from '../../utils/date';
import { getTraderOrThrow } from '../traders/trader.service';

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

/// Create or replace the trader's work area for a specific date.
export async function upsertWorkArea(traderId: string, input: UpsertWorkAreaInput) {
  await getTraderOrThrow(traderId);
  const date = parseDate(input.date);
  return prisma.workArea.upsert({
    where: { traderId_date: { traderId, date } },
    update: { area: input.area },
    create: { traderId, date, area: input.area },
  });
}

export async function getWorkArea(traderId: string, date: string) {
  await getTraderOrThrow(traderId);
  const dateOnly = parseDate(date);
  const area = await prisma.workArea.findUnique({
    where: { traderId_date: { traderId, date: dateOnly } },
  });
  if (!area) throw ApiError.notFound('No work area set for that date.');
  return area;
}