import { Router } from 'express';
import { loginHandler, registerHandler } from './auth.controller';

export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a trader account
 *     description: >
 *       Creates a User plus a Business and an owning Trader in one transaction.
 *       Requires either a businessName or a phone. Returns a JWT for immediate use.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: trader@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: supersecret
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               phone:
 *                 type: string
 *                 example: "+15550000000"
 *               businessName:
 *                 type: string
 *                 example: Jane's Business
 *     responses:
 *       '201':
 *         description: Account created. Returned in the success envelope.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuthResult'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '409':
 *         $ref: '#/components/responses/Conflict'
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in a trader
 *     description: Exchanges credentials for a JWT. Use the token as a `Bearer` header on protected routes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: trader@example.com
 *               password:
 *                 type: string
 *                 example: supersecret
 *     responses:
 *       '200':
 *         description: Authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuthResult'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 */
authRouter.post('/register', registerHandler);
authRouter.post('/login', loginHandler);