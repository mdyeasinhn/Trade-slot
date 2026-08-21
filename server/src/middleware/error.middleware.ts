import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, isAppError } from '../utils/errors';

/** Convert any thrown error into the consistent API error envelope. */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isAppError(err)) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof ZodError) {
    const messages = err.issues.map((issue) => issue.message);
    const validationError = AppError.validation(messages.join(' '), err.flatten());

    res.status(validationError.statusCode).json({
      success: false,
      error: {
        code: validationError.code,
        message: validationError.message,
        details: validationError.details,
      },
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

  const errorMessage = err instanceof Error ? `${err.name}: ${err.message}` : 'Unknown error';

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', errorMessage);

  const internalError = AppError.internal(
    process.env.NODE_ENV === 'production'
      ? undefined
      : err instanceof Error
        ? err.message
        : 'An unexpected error occurred.',
  );

  res.status(internalError.statusCode).json({
    success: false,
    error: {
      code: internalError.code,
      message: internalError.message,
    },
  });
}