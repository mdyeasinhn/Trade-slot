import { z } from 'zod';

export const chatMessageSchema = z.object({
  traderId: z.string().min(1),
  senderId: z.string().min(1),
  message: z.string().min(1),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;