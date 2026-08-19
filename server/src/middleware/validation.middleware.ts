import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/errors';

type RequestPart = 'body' | 'query' | 'params';

/** Validate a request part against a Zod schema before it reaches handlers. */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      throw ApiError.validation('Invalid request.', result.error.flatten());
    }
    req[part] = result.data as never;
    next();
  };
}