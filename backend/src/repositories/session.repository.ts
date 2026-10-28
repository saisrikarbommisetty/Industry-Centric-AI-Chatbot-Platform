import { prisma, isDatabaseConnected } from '../config/database';
import { ChatSessionMetadata } from '../types';
import { logger } from '../utils/logger';
import { getWelcomeMessageForSession } from '../config/greetings';

const memorySessions: Map<string, any> = new Map();

export class SessionRepository {
  async createSession(data: {
    id?: string;
    projectId: string;
    visitorId?: string;
    userName?: string;
    location?: string;
    sessionMetadata?: ChatSessionMetadata | Record<string, any>;
  }): Promise<any> {
    const id = data.id || `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const welcome = getWelcomeMessageForSession(id);
    const sessionRecord = {
      id,
      projectId: data.projectId,
      visitorId: data.visitorId || `vis-${Date.now()}`,
      userName: data.userName || null,
      intent: null,
      location: data.location || null,
      sessionMetadata: data.sessionMetadata || {
        state: 'GREETING',
        stepIndex: 0,
        welcomeMessage: welcome,
        discovery: {},
        lead: {},
      },
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };

    if (isDatabaseConnected) {
      try {
        return await prisma.chatSession.create({ data: sessionRecord as any });
      } catch (err: any) {
        logger.warn(`createSession DB error: ${err.message}. Storing in memory.`);
      }
    }

    memorySessions.set(id, sessionRecord);
    return sessionRecord;
  }

  async getSessionById(id: string): Promise<any | null> {
    if (isDatabaseConnected) {
      try {
        const session = await prisma.chatSession.findUnique({
          where: { id },
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
            leads: true,
          },
        });
        if (session) return session;
      } catch (err: any) {
        logger.warn(`getSessionById DB error: ${err.message}.`);
      }
    }
    return memorySessions.get(id) || null;
  }

  async updateSession(id: string, updates: Partial<{
    userName?: string;
    intent?: string;
    location?: string;
    sessionMetadata?: any;
    lastActivityAt?: Date;
  }>): Promise<any> {
    const patch = { ...updates, lastActivityAt: new Date() };

    if (isDatabaseConnected) {
      try {
        return await prisma.chatSession.update({ where: { id }, data: patch as any });
      } catch (err: any) {
        logger.warn(`updateSession DB error: ${err.message}.`);
      }
    }

    const existing = memorySessions.get(id) || {};
    const updated = { ...existing, ...patch };
    memorySessions.set(id, updated);
    return updated;
  }

  async resetSession(id: string): Promise<any> {
    const resetMetadata: ChatSessionMetadata = {
      state: 'GREETING',
      stepIndex: 0,
      discovery: {},
      lead: {},
    };

    return this.updateSession(id, {
      userName: undefined,
      intent: undefined,
      sessionMetadata: resetMetadata,
    });
  }

  async getSessionsByProjectId(projectId: string): Promise<any[]> {
    if (isDatabaseConnected) {
      try {
        return await prisma.chatSession.findMany({
          where: { projectId },
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
            leads: true,
          },
          orderBy: { lastActivityAt: 'desc' },
        });
      } catch (err: any) {
        logger.warn(`getSessionsByProjectId DB error: ${err.message}.`);
      }
    }

    return Array.from(memorySessions.values())
      .filter((s: any) => s.projectId === projectId)
      .sort((a: any, b: any) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }
}

export const sessionRepository = new SessionRepository();
