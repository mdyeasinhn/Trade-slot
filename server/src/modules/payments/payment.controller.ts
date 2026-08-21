import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { ApiError } from '../../utils/errors';
import { prisma } from '../../lib/prisma';
import { createPaymentForBooking } from './payment.service';
import { createConnectOnboardingLink, getConnectAccountStatus } from './stripe.service';
import { createPaymentSchema } from './payment.validation';

export const createPaymentHandler = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = createPaymentSchema.parse(req.body);
  const payment = await createPaymentForBooking(bookingId);
  sendResponse(res, 200, payment);
});

export const connectOnboardHandler = catchAsync(async (req: Request, res: Response) => {
  const traderId = req.auth?.traderId;
  if (!traderId) throw ApiError.forbidden('Only a trader can connect a Stripe account.');

  const trader = await prisma.trader.findUnique({
    where: { id: traderId },
    include: { user: { select: { email: true } } },
  });
  if (!trader) throw ApiError.notFound('Trader not found.');

  const result = await createConnectOnboardingLink(trader.id, {
    stripeAccountId: trader.stripeAccountId,
    name: trader.name,
    email: trader.user?.email ?? null,
  });

  if (trader.stripeAccountId !== result.accountId) {
    await prisma.trader.update({
      where: { id: trader.id },
      data: { stripeAccountId: result.accountId },
    });
  }

  sendResponse(res, 200, result);
});

export const connectStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const traderId = req.auth?.traderId;
  if (!traderId) throw ApiError.forbidden('Only a trader can view their Stripe status.');

  const trader = await prisma.trader.findUnique({ where: { id: traderId } });
  if (!trader) throw ApiError.notFound('Trader not found.');
  if (!trader.stripeAccountId) {
    sendResponse(res, 200, { connected: false, onboardingComplete: false });
    return;
  }

  const status = await getConnectAccountStatus(trader.stripeAccountId);

  // Sync the flags we cache locally.
  if (
    trader.stripeOnboardingDone !== status.onboardingComplete ||
    trader.stripeChargesEnabled !== status.chargesEnabled ||
    trader.stripePayoutsEnabled !== status.payoutsEnabled
  ) {
    await prisma.trader.update({
      where: { id: trader.id },
      data: {
        stripeOnboardingDone: status.onboardingComplete,
        stripeChargesEnabled: status.chargesEnabled,
        stripePayoutsEnabled: status.payoutsEnabled,
      },
    });
  }

  sendResponse(res, 200, { connected: true, ...status });
});