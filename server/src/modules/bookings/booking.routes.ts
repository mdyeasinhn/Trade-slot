import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { bookingController } from './booking.controller';

export const bookingsRouter = Router();

// Availability can be checked before auth (public read); booking creation is
// open to customers via the chat flow, but direct API creation still requires
// a trader session per the MVP routes in AGENT.md §13.
bookingsRouter.get('/availability', bookingController.availability);

bookingsRouter.use(authMiddleware);

bookingsRouter.post('/', bookingController.create);
bookingsRouter.get('/', bookingController.list);
bookingsRouter.get('/:id', bookingController.get);
bookingsRouter.patch('/:id/status', bookingController.updateStatus);