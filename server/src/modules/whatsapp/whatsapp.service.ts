import { ApiError } from '../../utils/errors';
import { env } from '../../config/env';

/**
 * WhatsApp Cloud API outbound messaging. This layer is transport-only: it
 * formats and sends replies. All booking logic lives in the shared engine.
 */

interface SendMessageParams {
  to: string; // WhatsApp number in E.164 form
  text: string;
}

async function sendTextMessage({ to, text }: SendMessageParams) {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    throw ApiError.internal('WhatsApp credentials are not configured.');
  }

  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { preview_url: true, body: text },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw ApiError.internal(`WhatsApp send failed (${res.status}): ${body}`);
  }
}

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  await sendTextMessage({ to, text });
}