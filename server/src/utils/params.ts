import type { Request } from 'express';

/** Extract a route param as a plain string (Express 5 types can be arrays). */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string') {
    throw new TypeError(`Route param "${name}" is missing.`);
  }
  return value;
}