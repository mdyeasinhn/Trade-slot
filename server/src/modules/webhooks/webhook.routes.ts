import express, { Request, Router } from 'express';
import { stripeWebhookHandler, whatsappVerifyHandler, whatsappWebhookHandler } from './webhook.controller';

export const webhooksRouter = Router();

// WhatsApp Cloud API verification + inbound messages.
webhooksRouter.get('/whatsapp', whatsappVerifyHandler);
webhooksRouter.post('/whatsapp', whatsappWebhookHandler);

// Stripe needs the raw body for signature verification.
webhooksRouter.post('/stripe', express.raw({ type: 'application/json' }), (req, res, next) => {
  (req as Request & { rawBody?: string }).rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : JSON.stringify(req.body ?? {});
  next();
}, stripeWebhookHandler);