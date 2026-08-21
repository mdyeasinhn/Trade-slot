export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SLOT_UNAVAILABLE'
  | 'DOUBLE_BOOKING'
  | 'INVALID_STATE'
  | 'PAYMENT_ERROR'
  | 'STRIPE_ERROR'
  | 'WHATSAPP_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static validation(message: string, details?: unknown) {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }
  static unauthorized(message = 'Authentication required.') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'You do not have permission to perform this action.') {
    return new AppError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Resource not found.') {
    return new AppError(404, 'NOT_FOUND', message);
  }
  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }
  static slotUnavailable(message = 'The requested slot is no longer available.') {
    return new AppError(409, 'SLOT_UNAVAILABLE', message);
  }
  static doubleBooking(message = 'That slot has already been taken.') {
    return new AppError(409, 'DOUBLE_BOOKING', message);
  }
  static invalidState(message: string) {
    return new AppError(409, 'INVALID_STATE', message);
  }
  static payment(message: string) {
    return new AppError(402, 'PAYMENT_ERROR', message);
  }
  static internal(message = 'An unexpected error occurred.') {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}