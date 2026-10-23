import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics/analytics.service';
import { projectRepository } from '../repositories/project.repository';

export class AnalyticsController {
  async trackEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, sessionId, eventType, metadata } = req.body;
      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      const targetProjectId = project ? project.id : projectId;

      await analyticsService.trackEvent({
        projectId: targetProjectId,
        sessionId,
        eventType,
        metadata,
      });

      res.status(200).json({
        success: true,
        data: { message: 'Event tracked' },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      const targetProjectId = project ? project.id : projectId;

      const stats = await analyticsService.getProjectAnalytics(targetProjectId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
