import { Response } from 'express';
import { ok, okEmpty } from './api-response';

/** Send the standard success envelope with an explicit status code. */
export function sendResponse<T>(res: Response, status: number, data: T, message?: string): void {
  res.status(status).json(ok(data, message));
}

/** Send an empty success envelope (200). */
export function sendEmpty(res: Response, message?: string): void {
  res.status(200).json(okEmpty(message));
}