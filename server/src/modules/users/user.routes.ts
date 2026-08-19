import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { meHandler } from '../users/users.controller';
import { getBusinessHandler } from '../businesses/business.controller';

export const usersRouter = Router();
export const businessesRouter = Router();

usersRouter.use(authMiddleware);
businessesRouter.use(authMiddleware);

usersRouter.get('/me', meHandler);

businessesRouter.get('/:id', getBusinessHandler);