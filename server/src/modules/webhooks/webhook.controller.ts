import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { handleStripeWebhook } from './stripe.webhook';
import { handleInbound, verifyWebhook } from '../whatsapp/whatsapp.controller';

export const stripeWebhookHandler = catchAsync(async (req: Request, res: Response) => {
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
  sendResponse(res, 200, result);
});

export { verifyWebhook as whatsappVerifyHandler, handleInbound as whatsappWebhookHandler };