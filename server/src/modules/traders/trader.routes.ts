import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { traderController } from '../traders/trader.controller';
import { workAreaController } from '../workAreas/workArea.controller';

export const tradersRouter = Router();

tradersRouter.use(authMiddleware);

tradersRouter.get('/:id', traderController.loadTrader);
tradersRouter.patch('/:id', traderController.patchTrader);

tradersRouter.post('/:id/work-area', workAreaController.upsertWorkArea);
tradersRouter.get('/:id/work-area', workAreaController.getWorkArea);