import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ok } from '../../utils/api-response';
import { ApiError } from '../../utils/errors';
import { prisma } from '../../lib/prisma';
import { createPaymentForBooking } from './payment.service';
import { createConnectOnboardingLink, getConnectAccountStatus } from './stripe.service';

export const createPaymentSchema = z.object({
  bookingId: z.string().min(1),
});

export async function createPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { bookingId } = createPaymentSchema.parse(req.body);
    const payment = await createPaymentForBooking(bookingId);
    res.json(ok(payment));
  } catch (err) {
    next(err);
  }
}

export async function connectOnboardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
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

    res.json(ok(result));
  } catch (err) {
    next(err);
  }
}

export async function connectStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const traderId = req.auth?.traderId;
    if (!traderId) throw ApiError.forbidden('Only a trader can view their Stripe status.');

    const trader = await prisma.trader.findUnique({ where: { id: traderId } });
    if (!trader) throw ApiError.notFound('Trader not found.');
    if (!trader.stripeAccountId) {
      res.json(ok({ connected: false, onboardingComplete: false }));
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

    res.json(ok({ connected: true, ...status }));
  } catch (err) {
    next(err);
  }
}