import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/errors';

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

export async function getTraderOrThrow(traderId: string) {
  const trader = await prisma.trader.findUnique({
    where: { id: traderId },
    include: {
      business: true,
      user: { select: { id: true, email: true } },
    },
  });
  if (!trader) throw ApiError.notFound('Trader not found.');
  return trader;
}

export async function updateTrader(traderId: string, input: UpdateTraderInput) {
  await getTraderOrThrow(traderId);
  return prisma.trader.update({
    where: { id: traderId },
    data: input,
    include: { business: true },
  });
}