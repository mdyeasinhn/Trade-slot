import { NextFunction, Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { ApiError } from '../../utils/errors';
import { param } from '../../utils/params';
import { prisma } from '../../lib/prisma';

/**
 * Businesses module. A business can own several traders (future-proofing the
 * schema; MVP seeds one trader per registered user).
 */
export async function getBusinessHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: param(req, 'id') },
      include: { traders: { select: { id: true, name: true, phone: true } } },
    });
    if (!business) throw ApiError.notFound('Business not found.');
    res.json(ok(business));
  } catch (err) {
    next(err);
  }
}