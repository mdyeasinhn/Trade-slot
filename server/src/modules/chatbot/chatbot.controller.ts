import { NextFunction, Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { ApiError } from '../../utils/errors';
import { messagingService } from '../messaging/messaging.service';
import { normalizeInbound, processIncomingMessage } from '../messaging/message-normalizer';
import { bookingEngine } from '../bookings/booking.engine.instance';
import { chatMessageSchema } from './chatbot.validation';

/**
 * Web chat transport (AGENT.md §12). Plain HTTP request/response — no
 * Socket.IO. This layer only normalizes the inbound message and formats the
 * channel-neutral reply for the frontend.
 */

export async function chatMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = chatMessageSchema.parse(req.body);

    const normalized = normalizeInbound({
      channel: 'WEB_CHAT',
      senderId: input.senderId,
      content: input.message,
      role: 'CUSTOMER',
    });

    const reply = await processIncomingMessage(
      normalized,
      { traderId: input.traderId },
      { engine: bookingEngine, persistence: messagingService },
    );

    res.json(ok(reply));
  } catch (err) {
    next(err);
  }
}