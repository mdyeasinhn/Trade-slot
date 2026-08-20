import { NextFunction, Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { ApiError } from '../../utils/errors';
import { param } from '../../utils/params';
import { getTraderOrThrow, updateTrader } from './trader.service';
import { updateTraderSchema } from './trader.validation';

async function loadTrader(req: Request, res: Response, next: NextFunction) {
  try {
    const trader = await getTraderOrThrow(param(req, 'id'));
    res.json(ok(trader));
  } catch (err) {
    next(err);
  }
}

async function patchTrader(req: Request, res: Response, next: NextFunction) {
  try {
    const traderId = param(req, 'id');
    if (req.auth?.traderId && req.auth.traderId !== traderId) {
      throw ApiError.forbidden();
    }
    const input = updateTraderSchema.parse(req.body);
    const trader = await updateTrader(traderId, input);
    res.json(ok(trader));
  } catch (err) {
    next(err);
  }
}

export const traderController = { loadTrader, patchTrader };