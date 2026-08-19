import { NextFunction, Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { handleStripeWebhook } from './stripe.webhook';
import { handleInbound, verifyWebhook } from '../whatsapp/whatsapp.controller';

export async function stripeWebhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing Stripe signature.' } });
      return;
    }
    const rawBody = (req as Request & { rawBody?: string }).rawBody;
    if (!rawBody) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing raw body.' } });
      return;
    }
    const result = await handleStripeWebhook(rawBody, signature);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
}

export { verifyWebhook as whatsappVerifyHandler, handleInbound as whatsappWebhookHandler };