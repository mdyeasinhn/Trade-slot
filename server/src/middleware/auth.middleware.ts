import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

export interface AuthContext {
  userId: string;
  role: string;
  traderId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized();
    }

    const token = header.slice('Bearer '.length).trim();
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    } catch {
      throw AppError.unauthorized('Invalid or expired token.');
    }

    if (!payload.sub) throw AppError.unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { trader: { select: { id: true } } },
    });
    if (!user) throw AppError.unauthorized('User no longer exists.');

    req.auth = {
      userId: user.id,
      role: user.role,
      traderId: user.trader?.id,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(AppError.unauthorized());
    if (!roles.includes(req.auth.role)) return next(AppError.forbidden());
    next();
  };
}