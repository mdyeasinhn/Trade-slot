import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { parseDate } from '../../utils/date';
import { getTraderOrThrow } from '../traders/trader.service';
import type { UpsertWorkAreaInput } from './workArea.validation';

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
  if (!area) throw AppError.notFound('No work area set for that date.');
  return area;
}