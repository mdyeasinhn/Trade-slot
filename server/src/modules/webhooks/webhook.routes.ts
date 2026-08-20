import express, { Request, Router } from 'express';
import { stripeWebhookHandler, whatsappVerifyHandler, whatsappWebhookHandler } from './webhook.controller';

export const webhooksRouter = Router();

/**
 * @openapi
 * /webhooks/whatsapp:
 *   get:
 *     tags: [Webhooks]
 *     summary: WhatsApp Cloud API verification
 *     description: >
 *       Responds to the WhatsApp Cloud API's subscription verification handshake.
 *       Must echo `hub.challenge` when `hub.verify_token` matches the configured
 *       token. Returns plain text, not the JSON envelope.
 *     parameters:
 *       - name: hub.mode
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: subscribe
 *       - name: hub.verify_token
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: hub.challenge
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: The verification challenge echoed as text/plain.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags: [Webhooks]
 *     summary: WhatsApp inbound message webhook
 *     description: >
 *       Receives inbound WhatsApp messages, resolves the target trader by phone
 *       number id, normalizes the message and runs it through the shared booking
 *       engine. Non-message notifications are acknowledged with 200.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Standard WhatsApp Cloud API webhook payload.
 *             properties:
 *               entry:
 *                 type: array
 *                 items:
 *                   type: object
 *             example:
 *               entry:
 *                 - changes:
 *                     - value:
 *                         metadata:
 *                           phone_number_id: "1234567890"
 *                         messages:
 *                           - from: "+15550001111"
 *                             id: wamid.abc
 *                             type: text
 *                             text:
 *                               body: I want a booking tomorrow at 10am
 *                             timestamp: "1720000000"
 *     responses:
 *       '200':
 *         description: Acknowledged, wrapped in the success envelope (data is null).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @openapi
 * /webhooks/stripe:
 *   post:
 *     tags: [Webhooks]
 *     summary: Stripe webhook
 *     description: >
 *       Receives Stripe events with a raw JSON body and a `stripe-signature`
 *       header. Events are signature-verified and processed idempotently via
 *       the WebhookEvent ledger, so Stripe retries are no-ops. This is `POST
 *       /api/webhooks/stripe` with a raw body, not the standard API envelope.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe event object.
 *     parameters:
 *       - name: stripe-signature
 *         in: header
 *         required: true
 *         description: Stripe webhook signature header.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: The received event type and whether it was newly processed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StripeWebhookResult'
 *       '400':
 *         description: Missing signature, raw body, or invalid signature.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */

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