import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { messagingService } from '../messaging/messaging.service';
import { normalizeInbound, processIncomingMessage } from '../messaging/message-normalizer';
import { bookingEngine } from '../bookings/booking.engine.instance';
import { chatMessageSchema } from './chatbot.validation';

/**
 * Web chat transport (AGENT.md §12). Plain HTTP request/response — no
 * Socket.IO. This layer only normalizes the inbound message and formats the
 * channel-neutral reply for the frontend.
 */

export const chatMessageHandler = catchAsync(async (req: Request, res: Response) => {
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

  sendResponse(res, 200, reply);
});