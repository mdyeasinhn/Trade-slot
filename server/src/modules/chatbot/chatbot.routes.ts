import { Router } from 'express';
import { chatMessageHandler } from './chatbot.controller';

export const chatRouter = Router();

chatRouter.post('/message', chatMessageHandler);