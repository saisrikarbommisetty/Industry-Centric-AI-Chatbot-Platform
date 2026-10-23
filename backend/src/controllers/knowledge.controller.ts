import { Request, Response, NextFunction } from 'express';
import { knowledgeRepository } from '../repositories/knowledge.repository';
import { projectRepository } from '../repositories/project.repository';
import { crawlerService } from '../services/crawler/crawler.service';
import { chunkingService } from '../services/rag/chunking.service';
import { embeddingService } from '../services/embeddings/embedding.service';
import { AppError } from '../middleware/errorHandler.middleware';
import { logger } from '../utils/logger';

export class KnowledgeController {
  async addUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { url, title, type } = req.body;

      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      if (!project) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }

      const source = await knowledgeRepository.createSource({
        projectId: project.id,
        url,
        title: title || url,
        type: type || 'URL',
        status: 'PENDING',
      });

      // Trigger asynchronous crawl & index for this URL
      this.processSingleSource(project.id, source).catch((err) =>
        logger.error(`Error processing single source ${url}: ${err.message}`)
      );

      res.status(201).json({
        success: true,
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  async ingestWebsite(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { maxPages } = req.body;

      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      if (!project) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }

      // Run ingestion
      const summary = await this.runIngestionPipeline(project.id, project.websiteUrl, maxPages || 30);

      res.status(200).json({
        success: true,
        data: {
          message: 'Website ingestion complete',
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async reindex(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      if (!project) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }

      const summary = await this.runIngestionPipeline(project.id, project.websiteUrl, 30);

      res.status(200).json({
        success: true,
        data: {
          message: 'Re-indexing complete',
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSources(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      const targetId = project ? project.id : projectId;

      const sources = await knowledgeRepository.getSourcesByProjectId(targetId);

      res.status(200).json({
        success: true,
        data: sources,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const source = await knowledgeRepository.getSourceById(id);
      if (!source) {
        return next(new AppError('Knowledge source not found', 404, 'SOURCE_NOT_FOUND'));
      }

      res.status(200).json({
        success: true,
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await knowledgeRepository.deleteSource(id);

      res.status(200).json({
        success: true,
        data: { message: 'Knowledge source deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      const targetId = project ? project.id : projectId;

      const sources = await knowledgeRepository.getSourcesByProjectId(targetId);
      const totalDocs = await knowledgeRepository.getDocumentsByProjectId(targetId);
      const allChunks = await knowledgeRepository.getAllChunks(targetId);

      res.status(200).json({
        success: true,
        data: {
          status: 'ready',
          sourcesCount: sources.length,
          documentsCount: totalDocs.length,
          chunksCount: allChunks.length,
          lastSync: sources[0]?.lastIndexedAt || new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper: Process a single source URL into documents and pgvector chunks
   */
  private async processSingleSource(projectId: string, source: any) {
    await knowledgeRepository.updateSource(source.id, { status: 'CRAWLING' });

    try {
      const page = await crawlerService.fetchAndExtractPage(source.url);
      if (!page) {
        await knowledgeRepository.updateSource(source.id, {
          status: 'FAILED',
          errorMessage: 'Could not fetch page content',
        });
        return;
      }

      // Check if document exists and content is unchanged
      const existingDoc = await knowledgeRepository.findDocumentByUrl(projectId, page.url);
      if (existingDoc && existingDoc.contentHash === page.contentHash) {
        await knowledgeRepository.updateSource(source.id, {
          status: 'INDEXED',
          lastIndexedAt: new Date(),
          contentHash: page.contentHash,
        });
        return;
      }

      // Create or update document
      const doc = await knowledgeRepository.createDocument({
        sourceId: source.id,
        projectId,
        title: page.title,
        url: page.url,
        content: page.extractedText,
        metadata: page.metadata,
        contentHash: page.contentHash,
      });

      // Clear old chunks if any
      await knowledgeRepository.deleteDocumentChunks(doc.id);

      // Chunk and embed
      const chunks = chunkingService.chunkPage(page);
      for (const chunk of chunks) {
        const embedding = await embeddingService.generateEmbedding(chunk.content);
        await knowledgeRepository.createChunk({
          documentId: doc.id,
          projectId,
          content: chunk.content,
          embedding,
          metadata: chunk.metadata,
          chunkIndex: chunk.chunkIndex,
        });
      }

      await knowledgeRepository.updateSource(source.id, {
        status: 'INDEXED',
        lastIndexedAt: new Date(),
        lastCrawledAt: new Date(),
        contentHash: page.contentHash,
        extractedSummary: `${page.title}. Extracted ${chunks.length} knowledge chunks.`,
      });
    } catch (err: any) {
      logger.error(`Failed to process source ${source.id}: ${err.message}`);
      await knowledgeRepository.updateSource(source.id, {
        status: 'FAILED',
        errorMessage: err.message,
      });
    }
  }

  /**
   * Core Reusable Ingestion Pipeline
   */
  async runIngestionPipeline(projectId: string, startUrl: string, maxPages = 30) {
    logger.info(`=== STARTING INGESTION PIPELINE: ${startUrl} ===`);
    const pages = await crawlerService.crawlWebsite(startUrl, maxPages);

    let docsCreated = 0;
    let chunksCreated = 0;
    let embeddingsGenerated = 0;
    let skippedUnchanged = 0;
    let failed = 0;

    for (const page of pages) {
      try {
        // Create or find source record
        const source = await knowledgeRepository.createSource({
          projectId,
          url: page.url,
          title: page.title,
          type: 'URL',
          status: 'CRAWLING',
        });

        // Check if page already exists and is unchanged
        const existingDoc = await knowledgeRepository.findDocumentByUrl(projectId, page.url);
        if (existingDoc && existingDoc.contentHash === page.contentHash) {
          skippedUnchanged++;
          await knowledgeRepository.updateSource(source.id, {
            status: 'INDEXED',
            lastIndexedAt: new Date(),
          });
          continue;
        }

        const doc = await knowledgeRepository.createDocument({
          sourceId: source.id,
          projectId,
          title: page.title,
          url: page.url,
          content: page.extractedText,
          metadata: page.metadata,
          contentHash: page.contentHash,
        });
        docsCreated++;

        await knowledgeRepository.deleteDocumentChunks(doc.id);

        const chunks = chunkingService.chunkPage(page);
        for (const chunk of chunks) {
          const embedding = await embeddingService.generateEmbedding(chunk.content);
          embeddingsGenerated++;

          await knowledgeRepository.createChunk({
            documentId: doc.id,
            projectId,
            content: chunk.content,
            embedding,
            metadata: chunk.metadata,
            chunkIndex: chunk.chunkIndex,
          });
          chunksCreated++;
        }

        await knowledgeRepository.updateSource(source.id, {
          status: 'INDEXED',
          lastIndexedAt: new Date(),
          lastCrawledAt: new Date(),
          contentHash: page.contentHash,
          extractedSummary: `${page.title} — ${chunks.length} chunks indexed.`,
        });
      } catch (err: any) {
        failed++;
        logger.error(`Error ingesting page ${page.url}: ${err.message}`);
      }
    }

    const summary = {
      pagesDiscovered: pages.length,
      pagesProcessed: pages.length - failed,
      documentsCreated: docsCreated,
      chunksCreated,
      embeddingsGenerated,
      skippedUnchanged,
      failed,
    };

    logger.info(`=== INGESTION SUMMARY ===`);
    logger.info(JSON.stringify(summary, null, 2));
    return summary;
  }
}

export const knowledgeController = new KnowledgeController();
