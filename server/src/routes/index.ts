import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter, businessesRouter } from '../modules/users/user.routes';
import { tradersRouter } from '../modules/traders/trader.routes';
import { chatRouter } from '../modules/chatbot/chatbot.routes';
import { bookingsRouter } from '../modules/bookings/booking.routes';
import { paymentsRouter, stripeConnectRouter } from '../modules/payments/payment.routes';
import { webhooksRouter } from '../modules/webhooks/webhook.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/businesses', businessesRouter);
apiRouter.use('/traders', tradersRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/stripe/connect', stripeConnectRouter);
apiRouter.use('/webhooks', webhooksRouter);