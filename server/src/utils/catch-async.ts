import { NextFunction, Request, RequestHandler, Response } from 'express';

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/** Wrap an async Express handler so any rejection is forwarded to the error middleware. */
export function catchAsync(handler: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}