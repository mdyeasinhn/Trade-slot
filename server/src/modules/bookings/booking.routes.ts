import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { bookingController } from './booking.controller';

export const bookingsRouter = Router();

/**
 * @openapi
 * /bookings/availability:
 *   get:
 *     tags: [Bookings]
 *     summary: List available slots for a trader on a date
 *     description: >
 *       Public availability check (no auth). Returns the contiguous free slots
 *       for the trader's working window on the date, respecting job duration and
 *       travel buffer. Final availability is always re-checked server-side at
 *       booking time.
 *     parameters:
 *       - name: traderId
 *         in: query
 *         required: true
 *         description: Trader id.
 *         schema:
 *           type: string
 *       - name: date
 *         in: query
 *         required: true
 *         description: Requested day, "YYYY-MM-DD", in the trader's timezone.
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       '200':
 *         description: Available slots, wrapped in the success envelope.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AvailableSlot'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @openapi
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking
 *     description: >
 *       Creates a booking after a concurrency-safe availability re-check.
 *       Booking fees are resolved server-side, never from the client.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [traderId, date, startTime, customerName, customerPhone]
 *             properties:
 *               traderId:
 *                 type: string
 *                 example: cm8y...
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-21
 *                 description: Calendar day in the trader's timezone.
 *               startTime:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                 example: "10:00"
 *                 description: Local start time, "HH:mm".
 *               customerName:
 *                 type: string
 *                 example: Bob Jones
 *               customerPhone:
 *                 type: string
 *                 example: "+15550001111"
 *               serviceDescription:
 *                 type: string
 *                 example: Bathroom tap replacement
 *               conversationId:
 *                 type: string
 *                 description: Optional chat conversation to link the booking to.
 *     responses:
 *       '201':
 *         description: The created booking (status REQUESTED).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '409':
 *         $ref: '#/components/responses/Conflict'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *   get:
 *     tags: [Bookings]
 *     summary: List the trader's bookings
 *     description: Lists bookings for the authenticated trader, optionally filtered by date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: date
 *         in: query
 *         required: false
 *         description: Only bookings on this day, "YYYY-MM-DD".
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       '200':
 *         description: Bookings, wrapped in the success envelope.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @openapi
 * /bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get a booking
 *     description: Returns a single booking. Traders can only read their own.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Booking id.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: The booking, wrapped in the success envelope.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @openapi
 * /bookings/{id}/status:
 *   patch:
 *     tags: [Bookings]
 *     summary: Update a booking's status
 *     description: >
 *       Moves a booking through its lifecycle with transition validation
 *       (e.g. REQUESTED -> CONFIRMED -> PAYMENT_PENDING -> PAID ...).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Booking id.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, PAYMENT_PENDING, PAID, COMPLETED, CANCELLED]
 *                 example: CONFIRMED
 *               cancelledReason:
 *                 type: string
 *                 description: Required context when cancelling.
 *     responses:
 *       '200':
 *         description: The updated booking.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '409':
 *         $ref: '#/components/responses/Conflict'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

// Availability can be checked before auth (public read); booking creation is
// open to customers via the chat flow, but direct API creation still requires
// a trader session per the MVP routes in AGENT.md §13.
bookingsRouter.get('/availability', bookingController.availability);

bookingsRouter.use(authMiddleware);

bookingsRouter.post('/', bookingController.create);
bookingsRouter.get('/', bookingController.list);
bookingsRouter.get('/:id', bookingController.get);
bookingsRouter.patch('/:id/status', bookingController.updateStatus);