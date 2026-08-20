import { Router } from 'express';
import { chatMessageHandler } from './chatbot.controller';

export const chatRouter = Router();

/**
 * @openapi
 * /chat/message:
 *   post:
 *     tags: [Chat]
 *     summary: Send a web chat message
 *     description: >
 *       Web chat transport into the shared booking engine (AGENT.md §12). The
 *       message is normalized, routed like any other channel, and a
 *       channel-neutral reply is returned for the frontend to render. No auth
 *       is required — customers book through this endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [traderId, senderId, message]
 *             properties:
 *               traderId:
 *                 type: string
 *                 example: cm8y...
 *               senderId:
 *                 type: string
 *                 description: Client-generated web session id.
 *                 example: web-session-123
 *               message:
 *                 type: string
 *                 example: I want a booking tomorrow at 10am
 *     responses:
 *       '200':
 *         description: The bot reply, wrapped in the success envelope.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChatReply'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
chatRouter.post('/message', chatMessageHandler);