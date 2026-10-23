import { Request, Response, NextFunction } from 'express';
import { projectRepository } from '../repositories/project.repository';
import { AppError } from '../middleware/errorHandler.middleware';

export class ProjectController {
  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectRepository.findAll();
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

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectRepository.create(req.body);
      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await projectRepository.update(id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await projectRepository.delete(id);
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
