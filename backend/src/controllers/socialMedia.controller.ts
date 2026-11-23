import { Request, Response, NextFunction } from 'express';
import { socialMediaService } from '../services/social/socialMedia.service';
import { projectRepository } from '../repositories/project.repository';
import { AppError } from '../middleware/errorHandler.middleware';
import { logger } from '../utils/logger';

export class SocialMediaController {
  /**
   * Detect social media platform from URL
   */
  async detect(req: Request, res: Response, next: NextFunction) {
    try {
      const url = req.body?.url || (req.query?.url as string);
      if (!url) {
        return next(new AppError('URL is required', 400, 'URL_REQUIRED'));
      }

      const result = socialMediaService.detectAndValidate(url);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview post content before indexing
   */
  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const { url, manualContent, content } = req.body;
      if (!url) {
        return next(new AppError('URL is required for preview', 400, 'URL_REQUIRED'));
      }

      const previewResult = await socialMediaService.preview(url, manualContent || content);
      res.status(200).json({
        success: previewResult.success,
        data: previewResult.data,
        error: previewResult.error,
        status: previewResult.status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a social media source URL to a bot's knowledge base
   */
  async addSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { url, title, platform, manualContent, content } = req.body;

      if (!url) {
        return next(new AppError('Social media post URL is required', 400, 'URL_REQUIRED'));
      }

      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      if (!project) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }

      const result = await socialMediaService.addSource({
        projectId: project.id,
        url,
        title,
        platform,
        manualContent: manualContent || content,
      });

      if (result.isDuplicate) {
        return res.status(200).json({
          success: true,
          isDuplicate: true,
          message: 'This social media post URL has already been added to this bot. You can refresh it to pull recent changes.',
          data: result.source,
        });
      }

      const extractionFailed = result.extractionResult && !result.extractionResult.success;
      res.status(extractionFailed ? 200 : 201).json({
        success: !extractionFailed,
        isDuplicate: false,
        data: result.source,
        extraction: result.extractionResult,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * List all social media sources for a project
   */
  async listSources(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      if (!project) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }

      const sources = await socialMediaService.listSources(project.id);
      res.status(200).json({
        success: true,
        data: sources,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh a social media source (re-extract, update chunks & embeddings)
   */
  async refreshSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, id } = req.params;
      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      if (!project) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }

      const refreshResult = await socialMediaService.refreshSource(project.id, id);
      res.status(200).json({
        success: refreshResult.success,
        data: refreshResult.data,
        error: refreshResult.error,
        status: refreshResult.status,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Delete a social media source and clear chunks from knowledge base
   */
  async deleteSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, id } = req.params;
      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      if (!project) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }

      await socialMediaService.deleteSource(project.id, id);
      res.status(200).json({
        success: true,
        data: { message: 'Social media knowledge source removed successfully' },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get live processing status of a social media source
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const liveStatus = socialMediaService.getLiveStatus(id);
      res.status(200).json({
        success: true,
        data: liveStatus || { status: 'INDEXED', message: 'Ready' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const socialMediaController = new SocialMediaController();
