import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { AppError } from '../../utils/errors';
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

const createBookingHandler = catchAsync(async (req: Request, res: Response) => {
  const input = createBookingSchema.parse(req.body);
  const request: SlotRequest = { ...input };
  const booking = await createBooking(request);
  sendResponse(res, 201, booking);
});

const listBookingsHandler = catchAsync(async (req: Request, res: Response) => {
  const { date } = listBookingsQuerySchema.parse(req.query);
  const traderId = req.auth?.traderId;
  if (!traderId) throw AppError.forbidden();
  const bookings = await listBookings(traderId, { date });
  sendResponse(res, 200, bookings);
});

const getBookingHandler = catchAsync(async (req: Request, res: Response) => {
  const booking = await getBookingOrThrow(param(req, 'id'));
  if (req.auth?.traderId && booking.traderId !== req.auth.traderId) {
    throw AppError.forbidden();
  }
  sendResponse(res, 200, booking);
});

const updateStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const input = updateStatusSchema.parse(req.body);
  const booking = await updateBookingStatus(param(req, 'id'), input.status, {
    cancelledReason: input.cancelledReason,
  });
  sendResponse(res, 200, booking);
});

const availabilityHandler = catchAsync(async (req: Request, res: Response) => {
  const { traderId, date } = availabilityQuerySchema.parse(req.query);
  const slots = await listAvailableSlots(traderId, date);
  sendResponse(res, 200, slots);
});

export const bookingController = {
  create: createBookingHandler,
  list: listBookingsHandler,
  get: getBookingHandler,
  updateStatus: updateStatusHandler,
  availability: availabilityHandler,
};