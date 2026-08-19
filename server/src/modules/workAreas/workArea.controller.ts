import { NextFunction, Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { ApiError } from '../../utils/errors';
import { param } from '../../utils/params';
import {
  getWorkArea,
  listWorkAreaSchema,
  upsertWorkArea,
  upsertWorkAreaSchema,
} from './workArea.service';

async function upsertWorkAreaHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const traderId = param(req, 'id');
    if (req.auth?.traderId && req.auth.traderId !== traderId) {
      throw ApiError.forbidden();
    }
    const input = upsertWorkAreaSchema.parse(req.body);
    const area = await upsertWorkArea(traderId, input);
    res.json(ok(area));
  } catch (err) {
    next(err);
  }
}

async function getWorkAreaHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = listWorkAreaSchema.parse(req.query);
    const area = await getWorkArea(param(req, 'id'), input.date);
    res.json(ok(area));
  } catch (err) {
    next(err);
  }
}

export const workAreaController = {
  upsertWorkArea: upsertWorkAreaHandler,
  getWorkArea: getWorkAreaHandler,
};