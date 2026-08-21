import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { AppError } from '../../utils/errors';
import { prisma } from '../../lib/prisma';

/**
 * Users module. Minimal MVP surface: the authenticated user reads their own
 * identity (auth owns create/login). Kept separate from trader config.
 */
export const meHandler = catchAsync(async (req: Request, res: Response) => {
  if (!req.auth) throw AppError.unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: req.auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      trader: { select: { id: true } },
    },
  });
  if (!user) throw AppError.notFound('User not found.');
  sendResponse(res, 200, user);
});