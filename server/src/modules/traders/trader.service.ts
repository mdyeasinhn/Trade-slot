import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/errors';
import type { UpdateTraderInput } from './trader.validation';

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