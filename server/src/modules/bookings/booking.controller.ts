import { NextFunction, Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { ApiError } from '../../utils/errors';
import { param } from '../../utils/params';
import { createBooking, listBookings, getBookingOrThrow, updateBookingStatus } from './booking.service';
import { listAvailableSlots } from './scheduling.service';
import type { SlotRequest } from './booking.types';
import {
  availabilityQuerySchema,
  createBookingSchema,
  listBookingsQuerySchema,
  updateStatusSchema,
} from './booking.validation';

async function createBookingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createBookingSchema.parse(req.body);
    const request: SlotRequest = { ...input };
    const booking = await createBooking(request);
    res.status(201).json(ok(booking));
  } catch (err) {
    next(err);
  }
}

async function listBookingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { date } = listBookingsQuerySchema.parse(req.query);
    const traderId = req.auth?.traderId;
    if (!traderId) throw ApiError.forbidden();
    const bookings = await listBookings(traderId, { date });
    res.json(ok(bookings));
  } catch (err) {
    next(err);
  }
}

async function getBookingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await getBookingOrThrow(param(req, 'id'));
    if (req.auth?.traderId && booking.traderId !== req.auth.traderId) {
      throw ApiError.forbidden();
    }
    res.json(ok(booking));
  } catch (err) {
    next(err);
  }
}

async function updateStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateStatusSchema.parse(req.body);
    const booking = await updateBookingStatus(param(req, 'id'), input.status, {
      cancelledReason: input.cancelledReason,
    });
    res.json(ok(booking));
  } catch (err) {
    next(err);
  }
}

async function availabilityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { traderId, date } = availabilityQuerySchema.parse(req.query);
    const slots = await listAvailableSlots(traderId, date);
    res.json(ok(slots));
  } catch (err) {
    next(err);
  }
}

export const bookingController = {
  create: createBookingHandler,
  list: listBookingsHandler,
  get: getBookingHandler,
  updateStatus: updateStatusHandler,
  availability: availabilityHandler,
};