import { Request, Response, NextFunction } from 'express';
import { projectRepository } from '../repositories/project.repository';
import { knowledgeController } from './knowledge.controller';
import { AppError } from '../middleware/errorHandler.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export class ProjectController {
  async getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projects = await projectRepository.findAll(req.user);
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = (await projectRepository.findById(id)) || (await projectRepository.findBySlug(id));
      if (!project) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectRepository.create({
        ...req.body,
        userId: req.user?.id || req.body.userId || null,
      });
      const initialSources = req.body.initialSources || [];

      // 1. Always ensure foundational knowledge exists for this project immediately
      try {
        await knowledgeController.ensureFoundationalKnowledge(project);
      } catch (err: any) {
        logger.warn(`Could not seed foundational knowledge: ${err.message}`);
      }

      // 2. If initialSources are supplied, process and index them into knowledge repository
      if (Array.isArray(initialSources) && initialSources.length > 0) {
        for (const src of initialSources) {
          knowledgeController.processSingleSourceData(project.id, src).catch((err: any) => {
            logger.warn(`Failed to process initial source for project ${project.id}: ${err.message}`);
          });
        }
      }

      // 3. If websiteUrl is supplied, automatically trigger website crawling & knowledge indexing for this bot
      if (project.websiteUrl) {
        knowledgeController.runIngestionPipeline(project.id, project.websiteUrl, 20).catch((err) => {
          logger.warn(`Background crawl/ingestion failed for project ${project.id}: ${err.message}`);
        });
      }

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = (await projectRepository.findById(id)) || (await projectRepository.findBySlug(id));
      if (!existing) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }
      if (existing.userId && req.user?.role !== 'ADMIN' && existing.userId !== req.user?.id) {
        return next(new AppError('You do not have permission to update this bot.', 403, 'FORBIDDEN'));
      }
      const updated = await projectRepository.update(existing.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = (await projectRepository.findById(id)) || (await projectRepository.findBySlug(id));
      if (!existing) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }
      if (existing.userId && req.user?.role !== 'ADMIN' && existing.userId !== req.user?.id) {
        return next(new AppError('You do not have permission to delete this bot.', 403, 'FORBIDDEN'));
      }
      await projectRepository.delete(existing.id);
      res.status(200).json({
        success: true,
        data: { message: 'Project deleted' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
