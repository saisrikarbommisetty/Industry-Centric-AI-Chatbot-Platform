import { prisma, isDatabaseConnected } from '../config/database';
import { logger } from '../utils/logger';

const memoryLeads: Map<string, any[]> = new Map();

export class LeadRepository {
  async getLeadBySessionId(sessionId: string, projectId?: string): Promise<any | null> {
    if (isDatabaseConnected) {
      try {
        const lead = await prisma.lead.findFirst({
          where: {
            sessionId,
            ...(projectId ? { projectId } : {}),
          },
          orderBy: { updatedAt: 'desc' },
        });
        if (lead) return lead;
      } catch (err: any) {
        logger.warn(`getLeadBySessionId DB error: ${err.message}.`);
      }
    }

    const allLeads = projectId
      ? memoryLeads.get(projectId) || []
      : Array.from(memoryLeads.values()).flat();
    return allLeads.find((l) => l.sessionId === sessionId) || null;
  }

  async upsertLead(data: {
    projectId: string;
    sessionId?: string | null;
    name?: string;
    phone?: string;
    email?: string | null;
    intent?: string | null;
    status?: string;
    preferences?: Record<string, any>;
    source?: string;
  }): Promise<any> {
    if (isDatabaseConnected) {
      try {
        let existing = data.sessionId
          ? await prisma.lead.findFirst({
              where: { sessionId: data.sessionId, projectId: data.projectId },
            })
          : null;

        if (existing) {
          const updated = await prisma.lead.update({
            where: { id: existing.id },
            data: {
              ...(data.name ? { name: data.name } : {}),
              ...(data.phone ? { phone: data.phone } : {}),
              ...(data.email ? { email: data.email } : {}),
              ...(data.intent ? { intent: data.intent } : {}),
              preferences: {
                ...(typeof existing.preferences === 'object' && existing.preferences ? existing.preferences : {}),
                ...(data.preferences || {}),
              },
              updatedAt: new Date(),
            },
          });
          return updated;
        }

        const id = `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        return await prisma.lead.create({
          data: {
            id,
            projectId: data.projectId,
            sessionId: data.sessionId || null,
            name: data.name || 'Website Visitor',
            phone: data.phone || '',
            email: data.email || null,
            intent: data.intent || null,
            preferences: data.preferences || {},
            source: data.source || 'chatbot',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } catch (err: any) {
        logger.warn(`upsertLead DB error: ${err.message}. Storing in memory.`);
      }
    }

    const list = memoryLeads.get(data.projectId) || [];
    let memoryExisting = data.sessionId ? list.find((l) => l.sessionId === data.sessionId) : null;
    if (memoryExisting) {
      if (data.name) memoryExisting.name = data.name;
      if (data.phone) memoryExisting.phone = data.phone;
      if (data.email) memoryExisting.email = data.email;
      if (data.intent) memoryExisting.intent = data.intent;
      if (data.status) memoryExisting.status = data.status;
      memoryExisting.preferences = {
        ...(memoryExisting.preferences || {}),
        ...(data.preferences || {}),
      };
      memoryExisting.updatedAt = new Date();
      return memoryExisting;
    }

    const id = `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRecord = {
      id,
      projectId: data.projectId,
      sessionId: data.sessionId || null,
      name: data.name || 'Website Visitor',
      phone: data.phone || '',
      email: data.email || null,
      intent: data.intent || null,
      status: data.status || 'New Lead',
      preferences: data.preferences || {},
      source: data.source || 'chatbot',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    list.unshift(newRecord);
    memoryLeads.set(data.projectId, list);
    return newRecord;
  }

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
