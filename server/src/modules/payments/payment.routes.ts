import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { connectOnboardHandler, connectStatusHandler, createPaymentHandler } from './payment.controller';

export const paymentsRouter = Router();
export const stripeConnectRouter = Router();

paymentsRouter.use(authMiddleware);
stripeConnectRouter.use(authMiddleware);

/**
 * @openapi
 * /payments/create:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Stripe Checkout session for a booking
 *     description: >
 *       Creates (or returns the existing, idempotent) Stripe Checkout Session
 *       that charges the customer and transfers funds to the trader's connected
 *       account with the platform application fee captured.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: cm8z...
 *     responses:
 *       '200':
 *         description: The payment record with the hosted checkout URL.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '402':
 *         $ref: '#/components/responses/PaymentError'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @openapi
 * /stripe/connect/onboard:
 *   post:
 *     tags: [Stripe Connect]
 *     summary: Start Stripe Connect onboarding
 *     description: >
 *       Returns a Stripe Express account onboarding link for the authenticated
 *       trader, creating the connected account on first use.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Onboarding link for the trader's connected account.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ConnectOnboardResult'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @openapi
 * /stripe/connect/status:
 *   get:
 *     tags: [Stripe Connect]
 *     summary: Get the trader's Stripe Connect status
 *     description: Returns whether the trader's connected account is live and can charge and pay out.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: The connect status (disconnected or live details).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ConnectStatus'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

// Stripe Connect aliases used by the MVP routes in AGENT.md §13:
//   POST /api/stripe/connect/onboard
//   GET  /api/stripe/connect/status
stripeConnectRouter.post('/onboard', connectOnboardHandler);
stripeConnectRouter.get('/status', connectStatusHandler);