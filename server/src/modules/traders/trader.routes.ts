import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { traderController } from '../traders/trader.controller';
import { workAreaController } from '../workAreas/workArea.controller';

export const tradersRouter = Router();

tradersRouter.use(authMiddleware);

/**
 * @openapi
 * /traders/{id}:
 *   get:
 *     tags: [Traders]
 *     summary: Get a trader
 *     description: Returns the trader profile with its business and owning user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Trader id.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: The trader, wrapped in the success envelope.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Trader'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Traders]
 *     summary: Update a trader
 *     description: >
 *       Updates the trader's booking rules and profile fields. A trader can only
 *       patch their own record.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Trader id.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               phone:
 *                 type: string
 *                 example: "+15550000000"
 *               timezone:
 *                 type: string
 *                 example: America/New_York
 *               workDayStart:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                 example: 08:30
 *                 description: Local working-window start, "HH:mm".
 *               workDayEnd:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                 example: 16:30
 *                 description: Local working-window end, "HH:mm".
 *               jobDurationMin:
 *                 type: integer
 *                 minimum: 1
 *                 example: 60
 *               bufferMin:
 *                 type: integer
 *                 minimum: 0
 *                 example: 30
 *               bookingFee:
 *                 type: integer
 *                 minimum: 0
 *                 example: 5000
 *                 description: Minor units (cents).
 *     responses:
 *       '200':
 *         description: The updated trader, wrapped in the success envelope.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Trader'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @openapi
 * /traders/{id}/work-area:
 *   post:
 *     tags: [Work Areas]
 *     summary: Set a trader's work area for a date
 *     description: Creates or replaces the daily work area for the given date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Trader id.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, area]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-08-21
 *               area:
 *                 type: string
 *                 example: Southside
 *     responses:
 *       '200':
 *         description: The created or updated work area.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WorkArea'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *   get:
 *     tags: [Work Areas]
 *     summary: Get a trader's work area for a date
 *     description: Returns the work area configured for the trader on the requested date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Trader id.
 *         schema:
 *           type: string
 *       - name: date
 *         in: query
 *         required: true
 *         description: The work date, "YYYY-MM-DD".
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       '200':
 *         description: The work area for that date.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WorkArea'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
tradersRouter.get('/:id', traderController.loadTrader);
tradersRouter.patch('/:id', traderController.patchTrader);

tradersRouter.post('/:id/work-area', workAreaController.upsertWorkArea);
tradersRouter.get('/:id/work-area', workAreaController.getWorkArea);