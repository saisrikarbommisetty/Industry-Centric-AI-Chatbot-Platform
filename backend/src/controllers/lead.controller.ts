import { Request, Response, NextFunction } from 'express';
import { leadService } from '../services/leads/lead.service';
import { projectRepository } from '../repositories/project.repository';
import { AppError } from '../middleware/errorHandler.middleware';

export class LeadController {
  async createLead(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, sessionId, name, phone, email, intent, preferences, source } = req.body;

      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      const targetProjectId = project ? project.id : projectId;

      const lead = await leadService.captureLead({
        projectId: targetProjectId,
        sessionId,
        name,
        phone,
        email,
        intent,
        preferences,
        source: source || 'chatbot',
      });

      res.status(201).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      const targetProjectId = project ? project.id : projectId;

      const leads = await leadService.getProjectLeads(targetProjectId);

      res.status(200).json({
        success: true,
        data: leads,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const leadController = new LeadController();
