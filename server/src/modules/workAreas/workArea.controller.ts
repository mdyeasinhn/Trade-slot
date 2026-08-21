import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { ApiError } from '../../utils/errors';
import { param } from '../../utils/params';
import { getWorkArea, upsertWorkArea } from './workArea.service';
import { listWorkAreaSchema, upsertWorkAreaSchema } from './workArea.validation';

const upsertWorkAreaHandler = catchAsync(async (req: Request, res: Response) => {
  const traderId = param(req, 'id');
  if (req.auth?.traderId && req.auth.traderId !== traderId) {
    throw ApiError.forbidden();
  }
  const input = upsertWorkAreaSchema.parse(req.body);
  const area = await upsertWorkArea(traderId, input);
  sendResponse(res, 200, area);
});

const getWorkAreaHandler = catchAsync(async (req: Request, res: Response) => {
  const input = listWorkAreaSchema.parse(req.query);
  const area = await getWorkArea(param(req, 'id'), input.date);
  sendResponse(res, 200, area);
});

export const workAreaController = {
  upsertWorkArea: upsertWorkAreaHandler,
  getWorkArea: getWorkAreaHandler,
};