import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { AppError } from '../../utils/errors';
import { param } from '../../utils/params';
import { getTraderOrThrow, updateTrader } from './trader.service';
import { updateTraderSchema } from './trader.validation';

const loadTrader = catchAsync(async (req: Request, res: Response) => {
  const trader = await getTraderOrThrow(param(req, 'id'));
  sendResponse(res, 200, trader);
});

const patchTrader = catchAsync(async (req: Request, res: Response) => {
  const traderId = param(req, 'id');
  if (req.auth?.traderId && req.auth.traderId !== traderId) {
    throw AppError.forbidden();
  }
  const input = updateTraderSchema.parse(req.body);
  const trader = await updateTrader(traderId, input);
  sendResponse(res, 200, trader);
});

export const traderController = { loadTrader, patchTrader };