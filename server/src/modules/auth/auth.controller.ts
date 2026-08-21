import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { login, register } from './auth.service';
import { loginSchema, registerSchema } from './auth.validation';

export const registerHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await register(registerSchema.parse(req.body));
  sendResponse(res, 201, result);
});

export const loginHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await login(loginSchema.parse(req.body));
  sendResponse(res, 200, result);
});