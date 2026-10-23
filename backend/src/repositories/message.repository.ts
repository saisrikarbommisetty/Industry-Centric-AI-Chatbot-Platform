import { prisma, isDatabaseConnected } from '../config/database';
import { logger } from '../utils/logger';

const memoryMessages: Map<string, any[]> = new Map();

export class MessageRepository {
  async createMessage(data: {
    sessionId: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const id = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const msgRecord = {
      id,
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      metadata: data.metadata || {},
      createdAt: new Date(),
    };

    if (isDatabaseConnected) {
      try {
        return await prisma.chatMessage.create({ data: msgRecord });
      } catch (err: any) {
        logger.warn(`createMessage DB error: ${err.message}. Storing in memory.`);
      }
    }

    const list = memoryMessages.get(data.sessionId) || [];
    list.push(msgRecord);
    memoryMessages.set(data.sessionId, list);
    return msgRecord;
  }

  async getMessagesBySessionId(sessionId: string): Promise<any[]> {
    if (isDatabaseConnected) {
      try {
        return await prisma.chatMessage.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'asc' },
        });
      } catch (err: any) {
        logger.warn(`getMessagesBySessionId DB error: ${err.message}.`);
      }
    }

    return memoryMessages.get(sessionId) || [];
  }

  async getRecentMessagesBySessionId(sessionId: string, limit = 6): Promise<any[]> {
    if (isDatabaseConnected) {
      try {
        const msgs = await prisma.chatMessage.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        return msgs.reverse();
      } catch (err: any) {
        logger.warn(`getRecentMessagesBySessionId DB error: ${err.message}.`);
      }
    }

    const list = memoryMessages.get(sessionId) || [];
    return list.slice(-limit);
  }
}

export const messageRepository = new MessageRepository();
