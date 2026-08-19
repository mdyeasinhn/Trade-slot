import { NextFunction, Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { login, loginSchema, register, registerSchema } from './auth.service';

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await register(registerSchema.parse(req.body));
    res.status(201).json(ok(result));
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await login(loginSchema.parse(req.body));
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
}