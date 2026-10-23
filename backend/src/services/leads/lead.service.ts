import { leadRepository } from '../../repositories/lead.repository';
import { analyticsRepository } from '../../repositories/analytics.repository';
import { logger } from '../../utils/logger';
import { LeadDTO } from '../../types';

export class LeadService {
  async captureLead(data: {
    projectId: string;
    sessionId?: string | null;
    name: string;
    phone: string;
    email?: string | null;
    intent?: string | null;
    preferences?: Record<string, any>;
    source?: string;
  }): Promise<LeadDTO> {
    logger.info(`Capturing lead for project ${data.projectId}: ${data.name} (${data.phone})`);

    const lead = await leadRepository.createLead(data);

    // Record analytics event
    await analyticsRepository.recordEvent({
      projectId: data.projectId,
      sessionId: data.sessionId,
      eventType: 'lead_completed',
      metadata: {
        leadId: lead.id,
        name: data.name,
        intent: data.intent,
      },
    });

    return lead;
  }

  async getProjectLeads(projectId: string): Promise<LeadDTO[]> {
    return leadRepository.getLeadsByProjectId(projectId);
  }
}

export const leadService = new LeadService();
