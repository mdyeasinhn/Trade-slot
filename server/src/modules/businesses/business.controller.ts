import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { AppError } from '../../utils/errors';
import { param } from '../../utils/params';
import { prisma } from '../../lib/prisma';

/**
 * Businesses module. A business can own several traders (future-proofing the
 * schema; MVP seeds one trader per registered user).
 */
export const getBusinessHandler = catchAsync(async (req: Request, res: Response) => {
  const business = await prisma.business.findUnique({
    where: { id: param(req, 'id') },
    include: { traders: { select: { id: true, name: true, phone: true } } },
  });
  if (!business) throw AppError.notFound('Business not found.');
  sendResponse(res, 200, business);
});