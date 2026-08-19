import { Channel, MessageDirection, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import type { MessagePersistence } from './message-normalizer';
import type { MessageChannel } from './types';

/**
 * MessagePersistence backed by PostgreSQL. Implements the transport-neutral
 * conversation + message storage used by the shared inbound flow.
 */
class MessagingService implements MessagePersistence {
  async persistInbound(params: {
    traderId: string;
    channel: MessageChannel;
    senderId: string;
    content: string;
    externalId?: string;
    timestamp: Date;
  }): Promise<string> {
    const { traderId, channel, senderId, content, externalId, timestamp } = params;

    // Idempotency for WhatsApp webhook replays: if we already saw this
    // external message id, return the existing conversation untouched.
    if (externalId) {
      const existing = await prisma.message.findUnique({
        where: { externalId },
        select: { conversationId: true },
      });
      if (existing) return existing.conversationId;
    }

    return prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.upsert({
        where: {
          traderId_channel_senderId: {
            traderId,
            channel: channel as Channel,
            senderId,
          },
        },
        update: { lastMessageAt: timestamp },
        create: {
          traderId,
          channel: channel as Channel,
          senderId,
          lastMessageAt: timestamp,
        },
      });

      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          direction: MessageDirection.INBOUND,
          channel: channel as Channel,
          content,
          timestamp,
          externalId,
        },
      });

      return conversation.id;
    });
  }

  async persistOutbound(params: {
    conversationId: string;
    channel: MessageChannel;
    senderId: string;
    content: string;
    timestamp: Date;
  }): Promise<void> {
    const { conversationId, channel, senderId, content, timestamp } = params;

    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId,
          direction: MessageDirection.OUTBOUND,
          channel: channel as Channel,
          content,
          timestamp,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: timestamp },
      }),
    ]);
  }

  /// Read the JSON slot-filling state for a conversation.
  async getConversationState(conversationId: string): Promise<Prisma.JsonValue | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { state: true },
    });
    return conversation?.state ?? null;
  }

  async findConversation(traderId: string, channel: MessageChannel, senderId: string) {
    return prisma.conversation.findUnique({
      where: {
        traderId_channel_senderId: {
          traderId,
          channel: channel as Channel,
          senderId,
        },
      },
    });
  }
}

export const messagingService = new MessagingService();