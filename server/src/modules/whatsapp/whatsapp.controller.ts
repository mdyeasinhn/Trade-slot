import { Request, Response } from 'express';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';
import { prisma } from '../../lib/prisma';
import { messagingService } from '../messaging/messaging.service';
import { normalizeInbound, processIncomingMessage } from '../messaging/message-normalizer';
import { bookingEngine } from '../bookings/booking.engine.instance';
import { sendWhatsAppMessage } from './whatsapp.service';
import { catchAsync } from '../../utils/catch-async';
import { sendEmpty } from '../../utils/send-response';

/**
 * WhatsApp webhook (AGENT.md §11). Only verifies, parses, normalizes and
 * dispatches; it never contains booking logic. Routing: the inbound message is
 * matched to a trader by the WhatsApp Phone Number ID configured on the Trader.
 */

export async function verifyWebhook(req: Request, res: Response): Promise<void> {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN && challenge) {
    res.type('text/plain').send(String(challenge));
    return;
  }
  throw AppError.forbidden('WhatsApp webhook verification failed.');
}

interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string };
        messages?: Array<{
          from?: string;
          id?: string;
          type?: string;
          text?: { body?: string };
          timestamp?: string;
        }>;
      };
    }>;
  }>;
}

async function resolveTraderByPhoneNumberId(phoneNumberId: string) {
  const trader = await prisma.trader.findUnique({
    where: { whatsappPhoneNumberId: phoneNumberId },
  });
  if (!trader) {
    throw AppError.notFound(
      `No trader configured for WhatsApp phone number id "${phoneNumberId}".`,
    );
  }
  return trader;
}

export const handleInbound = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as WhatsAppWebhookPayload;

  const changes = payload.entry?.[0]?.changes?.[0];
  const value = changes?.value;
  const phoneNumberId = value?.metadata?.phone_number_id;
  const message = value?.messages?.[0];

  // Non-message notifications (statuses, etc.) are acknowledged.
  if (!phoneNumberId || !message?.from || !message.text?.body) {
    sendEmpty(res);
    return;
  }

  const trader = await resolveTraderByPhoneNumberId(phoneNumberId);

  const normalized = normalizeInbound({
    channel: 'WHATSAPP',
    senderId: message.from,
    content: message.text.body,
    externalId: message.id,
    role: 'CUSTOMER',
    timestamp: message.timestamp
      ? new Date(Number(message.timestamp) * 1000)
      : undefined,
  });

  const reply = await processIncomingMessage(normalized, { traderId: trader.id }, {
    engine: bookingEngine,
    persistence: messagingService,
  });

  // Outbound WhatsApp send is best-effort after the message is persisted.
  await sendWhatsAppMessage(message.from, reply.text).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to send WhatsApp reply:', err);
  });

  sendEmpty(res);
});