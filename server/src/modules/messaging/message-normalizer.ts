import { MessageDirection } from '@prisma/client';
import { AppError } from '../../utils/errors';
import type {
  ChatReply,
  MessageChannel,
  NormalizedMessage,
  SenderRole,
} from './types';

/**
 * Message normalizer + shared inbound flow.
 *
 * Every transport (WhatsApp webhook, web chat API) converts its raw payload
 * into a {@link NormalizedMessage} and calls {@link processIncomingMessage}.
 * This function:
 *   1. Persists the inbound message (deduping on externalId).
 *   2. Calls the shared booking engine to produce a reply.
 *   3. Persists the outbound reply and returns it for the transport to send.
 * No WhatsApp or HTTP-specific code lives here.
 */

export interface NormalizeInput {
  channel: MessageChannel;
  senderId: string;
  content: string;
  externalId?: string;
  role: SenderRole;
  timestamp?: Date;
}

export function normalizeInbound(input: NormalizeInput): NormalizedMessage {
  return {
    senderId: input.senderId,
    channel: input.channel,
    content: input.content.trim(),
    timestamp: input.timestamp ?? new Date(),
  };
}

export interface MessagePersistence {
  /** Get-or-create the conversation and persist the inbound message. Returns the conversation id. */
  persistInbound(params: {
    traderId: string;
    channel: MessageChannel;
    senderId: string;
    content: string;
    externalId?: string;
    timestamp: Date;
  }): Promise<string>;

  /** Persist the outbound reply text into the same conversation. */
  persistOutbound(params: {
    conversationId: string;
    channel: MessageChannel;
    senderId: string;
    content: string;
    timestamp: Date;
  }): Promise<void>;
}

export interface ChatEngine {
  /** Produce a channel-neutral reply for a customer message. Transport-agnostic. */
  handleCustomerMessage(
    traderId: string,
    senderId: string,
    content: string,
    channel: MessageChannel,
  ): Promise<ChatReply>;
}

export interface ProcessInboundOptions {
  traderId: string;
  externalId?: string;
}

/// Shared entry point for all inbound channels. See AGENT.md §7.
export async function processIncomingMessage(
  message: NormalizedMessage,
  options: ProcessInboundOptions,
  deps: {
    engine: ChatEngine;
    persistence: MessagePersistence;
  },
): Promise<ChatReply> {
  const conversationId = await deps.persistence.persistInbound({
    traderId: options.traderId,
    channel: message.channel,
    senderId: message.senderId,
    content: message.content,
    externalId: options.externalId,
    timestamp: message.timestamp,
  });

  let reply: ChatReply;
  try {
    reply = await deps.engine.handleCustomerMessage(
      options.traderId,
      message.senderId,
      message.content,
      message.channel,
    );
  } catch (err) {
    if (err instanceof AppError && err.statusCode < 500) {
      reply = { text: err.message };
    } else {
      throw err;
    }
  }

  await deps.persistence.persistOutbound({
    conversationId,
    channel: message.channel,
    senderId: message.senderId,
    content: reply.text,
    timestamp: new Date(),
  });

  return reply;
}

export type { MessageDirection };