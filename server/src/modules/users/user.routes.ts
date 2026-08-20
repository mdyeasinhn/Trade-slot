import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { meHandler } from '../users/users.controller';
import { getBusinessHandler } from '../businesses/business.controller';

export const usersRouter = Router();
export const businessesRouter = Router();

usersRouter.use(authMiddleware);
businessesRouter.use(authMiddleware);

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the authenticated user
 *     description: Reads the current user's identity (auth owns create/login).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: The authenticated user, wrapped in the success envelope.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserMe'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
usersRouter.get('/me', meHandler);

/**
 * @openapi
 * /businesses/{id}:
 *   get:
 *     tags: [Businesses]
 *     summary: Get a business and its traders
 *     description: Returns a business including its traders. A business can own several traders in future.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Business id.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: The business, wrapped in the success envelope.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Business'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
businessesRouter.get('/:id', getBusinessHandler);