import { NextFunction, Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { ApiError } from '../../utils/errors';
import { prisma } from '../../lib/prisma';

/**
 * Users module. Minimal MVP surface: the authenticated user reads their own
 * identity (auth owns create/login). Kept separate from trader config.
 */
export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw ApiError.unauthorized();
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
    if (!user) throw ApiError.notFound('User not found.');
    res.json(ok(user));
  } catch (err) {
    next(err);
  }
}