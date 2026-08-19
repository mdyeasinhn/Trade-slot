import { NextFunction, Request, Response } from 'express';
import { ApiError, isApiError } from '../utils/errors';

/** Convert any thrown error into the consistent API error envelope. */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isApiError(err)) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  // Prisma unique-constraint violation -> 409 with a stable code.
  if (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === 'P2002'
  ) {
    res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'A record with the same unique key already exists.' },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : String(err),
    },
  });
}