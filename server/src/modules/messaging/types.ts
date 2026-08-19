import type { Channel } from '@prisma/client';

export type MessageChannel = 'WHATSAPP' | 'WEB_CHAT';

export interface NormalizedMessage {
  senderId: string;
  channel: MessageChannel;
  content: string;
  timestamp: Date;
}

export type SenderRole = 'CUSTOMER' | 'TRADER';

export interface ProcessInboundOptions {
  traderId: string;
  senderRole?: SenderRole;
  externalId?: string;
}

/// Channel-neutral response the client (web or WhatsApp) can render.
export interface ChatReply {
  text: string;
  actions?: ChatAction[];
}

export type ChatAction = {
  type: 'text';
  label: string;
} | {
  type: 'payment_link';
  label: string;
  url: string;
} | {
  type: 'slot_choice';
  label: string;
  slot: string;
};

export type { Channel };