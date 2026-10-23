import { prisma, isDatabaseConnected } from '../config/database';
import { logger } from '../utils/logger';

const memoryLeads: Map<string, any[]> = new Map();

export class LeadRepository {
  async createLead(data: {
    projectId: string;
    sessionId?: string | null;
    name: string;
    phone: string;
    email?: string | null;
    intent?: string | null;
    preferences?: Record<string, any>;
    source?: string;
  }): Promise<any> {
    const id = `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const leadRecord = {
      id,
      projectId: data.projectId,
      sessionId: data.sessionId || null,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      intent: data.intent || null,
      preferences: data.preferences || {},
      source: data.source || 'chatbot',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isDatabaseConnected) {
      try {
        return await prisma.lead.create({ data: leadRecord });
      } catch (err: any) {
        logger.warn(`createLead DB error: ${err.message}. Storing in memory.`);
      }
    }

    const list = memoryLeads.get(data.projectId) || [];
    list.unshift(leadRecord);
    memoryLeads.set(data.projectId, list);
    return leadRecord;
  }

  async getLeadsByProjectId(projectId: string): Promise<any[]> {
    if (isDatabaseConnected) {
      try {
        return await prisma.lead.findMany({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
        });
      } catch (err: any) {
        logger.warn(`getLeadsByProjectId DB error: ${err.message}.`);
      }
    }

    return memoryLeads.get(projectId) || [];
  }
}

export const leadRepository = new LeadRepository();
