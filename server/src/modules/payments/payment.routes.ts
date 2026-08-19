import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { connectOnboardHandler, connectStatusHandler, createPaymentHandler } from './payment.controller';

export const paymentsRouter = Router();
export const stripeConnectRouter = Router();

paymentsRouter.use(authMiddleware);
stripeConnectRouter.use(authMiddleware);

paymentsRouter.post('/create', createPaymentHandler);

// Stripe Connect aliases used by the MVP routes in AGENT.md §13:
//   POST /api/stripe/connect/onboard
//   GET  /api/stripe/connect/status
stripeConnectRouter.post('/onboard', connectOnboardHandler);
stripeConnectRouter.get('/status', connectStatusHandler);