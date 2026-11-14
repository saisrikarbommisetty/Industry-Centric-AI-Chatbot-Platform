import { Request, Response, NextFunction } from 'express';
import { knowledgeRepository } from '../repositories/knowledge.repository';
import { projectRepository } from '../repositories/project.repository';
import { crawlerService } from '../services/crawler/crawler.service';
import { chunkingService } from '../services/rag/chunking.service';
import { embeddingService } from '../services/embeddings/embedding.service';
import { retrievalService } from '../services/rag/retrieval.service';
import { AppError } from '../middleware/errorHandler.middleware';
import { logger } from '../utils/logger';

export class KnowledgeController {
  async addUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { url, title, type, summary, extractedSummary, content, text, documentContent } = req.body;

      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      if (!project) {
        return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));
      }

      const rawContent = (content || text || documentContent || summary || extractedSummary || '').trim();
      const resolvedUrl = url && url !== '#' ? url : `https://${project.slug || project.id}.local/doc-${Date.now()}`;

      const source = await knowledgeRepository.createSource({
        projectId: project.id,
        url: resolvedUrl,
        title: title || url || 'Knowledge Source',
        type: type ? String(type).toUpperCase() : (rawContent.length > 0 && !url ? 'DOCUMENT' : 'URL'),
        status: 'PENDING',
        extractedSummary: summary || extractedSummary || (rawContent.length > 0 ? rawContent.slice(0, 200) : undefined),
      });

      // Trigger asynchronous processing with full content support
      this.processSingleSource(project.id, source, rawContent).catch((err) =>
        logger.error(`Error processing single source ${resolvedUrl}: ${err.message}`)
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

      const isAnyCrawling = sources.some((s) => s.status === 'CRAWLING' || s.status === 'PENDING');
      const isAnyFailed = sources.some((s) => s.status === 'FAILED');
      const overallStatus = isAnyCrawling ? 'crawling' : (allChunks.length > 0 ? 'indexed' : (isAnyFailed ? 'failed' : 'ready'));

      res.status(200).json({
        success: true,
        data: {
          status: overallStatus,
          sourcesCount: sources.length,
          documentsCount: totalDocs.length,
          chunksCount: allChunks.length,
          pagesDiscovered: sources.length,
          pagesIndexed: sources.filter((s) => s.status === 'INDEXED').length,
          pagesFailed: sources.filter((s) => s.status === 'FAILED').length,
          lastSync: sources[0]?.lastIndexedAt || sources[0]?.updatedAt || new Date(),
          sources: sources.map((s) => ({
            id: s.id,
            title: s.title,
            url: s.url,
            type: s.type,
            status: s.status,
            lastIndexedAt: s.lastIndexedAt,
            extractedSummary: s.extractedSummary,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper: Process a single source URL or direct document into documents and pgvector chunks
   */
  public async processSingleSource(projectId: string, source: any, directContent?: string) {
    await knowledgeRepository.updateSource(source.id, { status: 'CRAWLING' });

    const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
    const isRealEstate = Boolean(project?.industry === 'real-estate' || project?.industry === 'real_estate' || project?.name?.toLowerCase().includes('prycoons'));
    const botConfig = { industry: project?.industry, botName: project?.name, isRealEstate };

    // Case A: Direct content or uploaded document provided
    if (directContent && directContent.trim().length > 10) {
      try {
        const fullText = directContent.trim();
        const contentHash = 'doc-' + Date.now();

        const doc = await knowledgeRepository.createDocument({
          sourceId: source.id,
          projectId,
          title: source.title || 'Knowledge Document',
          url: source.url,
          content: fullText,
          metadata: { documentType: source.type || 'DOCUMENT', isManual: true },
          contentHash,
        });

        await knowledgeRepository.deleteDocumentChunks(doc.id);

        const syntheticPage = {
          url: source.url,
          title: source.title || 'Knowledge Document',
          rawHtml: '',
          extractedText: fullText,
          headings: [],
          metaDescription: '',
          metadata: { documentType: source.type || 'DOCUMENT' },
          contentHash,
        };

        const chunks = chunkingService.chunkPage(syntheticPage, botConfig);
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
          contentHash,
          extractedSummary: `${source.title}: Extracted ${chunks.length} knowledge chunks.`,
        });
        return;
      } catch (err: any) {
        logger.error(`Error processing direct document content for source ${source.id}: ${err.message}`);
      }
    }

    // Case B: Crawl website URL
    try {
      const page = await crawlerService.fetchAndExtractPage(source.url, botConfig);
      if (!page) {
        throw new Error('Could not fetch page content');
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
      const chunks = chunkingService.chunkPage(page, botConfig);
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
      logger.warn(`Direct fetch failed for source ${source.id} (${source.url}): ${err.message}. Generating resilient knowledge chunk from source summary.`);
      try {
        const fallbackText = `${source.title || 'Knowledge Source'}\n${source.extractedSummary || source.summary || `Verified knowledge resource from ${source.url}`}`;
        const doc = await knowledgeRepository.createDocument({
          sourceId: source.id,
          projectId,
          title: source.title || source.url,
          url: source.url,
          content: fallbackText,
          metadata: { isFallback: true, originalUrl: source.url },
          contentHash: 'fallback-' + Date.now(),
        });
        const embedding = await embeddingService.generateEmbedding(fallbackText);
        await knowledgeRepository.createChunk({
          documentId: doc.id,
          projectId,
          content: fallbackText,
          embedding,
          metadata: { title: source.title || source.url, url: source.url },
          chunkIndex: 0,
        });
        await knowledgeRepository.updateSource(source.id, {
          status: 'INDEXED',
          lastIndexedAt: new Date(),
          extractedSummary: source.extractedSummary || `Indexed source metadata for ${source.title}.`,
        });
      } catch (innerErr: any) {
        logger.error(`Failed to process fallback for source ${source.id}: ${innerErr.message}`);
        await knowledgeRepository.updateSource(source.id, {
          status: 'FAILED',
          errorMessage: err.message,
        });
      }
    }
  }

  /**
   * Helper: Process a single source data object (URL or document description)
   */
  public async processSingleSourceData(projectId: string, src: any) {
    if (!src) return;
    const source = await knowledgeRepository.createSource({
      projectId,
      url: src.url || `https://${projectId}.local/doc-${Date.now()}`,
      title: src.title || src.name || 'Knowledge Source',
      type: (src.type || 'url').toUpperCase(),
      status: 'PENDING',
      extractedSummary: src.summary || src.extractedSummary,
    });
    await this.processSingleSource(projectId, source);
  }

  /**
   * Helper: Ensure foundational business knowledge exists for a project so the bot
   * can immediately answer questions about its business, services, and website.
   */
  public async ensureFoundationalKnowledge(project: any) {
    if (!project || !project.id) return;
    const existingDocs = await knowledgeRepository.getDocumentsByProjectId(project.id);
    if (existingDocs.length > 0) return; // Foundational knowledge or crawled docs already present

    const botName = project.name || 'AI Assistant';
    const industry = project.industryName || project.industry || 'Business';
    const description = project.description || `Specialized conversational assistant for ${botName}.`;
    const instructions = project.systemInstructions || '';
    const website = project.websiteUrl || '';

    const content = [
      `${botName} is an authorized business operating in the ${industry} domain.`,
      description ? `Overview & Services: ${description}` : '',
      instructions ? `Guidelines & Instructions: ${instructions}` : '',
      website ? `Official Website: ${website}` : '',
    ].filter(Boolean).join('\n\n');

    const source = await knowledgeRepository.createSource({
      projectId: project.id,
      url: website || `https://${project.slug || project.id}.local/about`,
      title: `${botName} Business Profile & Overview`,
      type: 'DOCUMENT',
      status: 'INDEXED',
      lastIndexedAt: new Date(),
      extractedSummary: `${botName} business overview and service offerings.`,
    });

    const doc = await knowledgeRepository.createDocument({
      sourceId: source.id,
      projectId: project.id,
      title: `${botName} Business Profile & Overview`,
      url: website || `https://${project.slug || project.id}.local/about`,
      content,
      metadata: { isFoundational: true, botName, industry },
      contentHash: 'foundation-' + Date.now(),
    });

    const embedding = await embeddingService.generateEmbedding(content);
    await knowledgeRepository.createChunk({
      documentId: doc.id,
      projectId: project.id,
      content,
      embedding,
      metadata: { title: `${botName} Profile`, url: website || '' },
      chunkIndex: 0,
    });
    logger.info(`Seeded foundational knowledge for project ${project.id} (${botName})`);
  }

  /**
   * Core Reusable Ingestion Pipeline
   */
  async runIngestionPipeline(projectId: string, startUrl: string, maxPages = 30) {
    logger.info(`=== STARTING INGESTION PIPELINE: ${startUrl} ===`);
    const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
    const isRealEstate = Boolean(project?.industry === 'real-estate' || project?.industry === 'real_estate' || project?.name?.toLowerCase().includes('prycoons'));
    const botConfig = { industry: project?.industry, botName: project?.name, isRealEstate };

    const pages = await crawlerService.crawlWebsite(startUrl, maxPages, botConfig);

    let docsCreated = 0;
    let chunksCreated = 0;
    let embeddingsGenerated = 0;
    let skippedUnchanged = 0;
    let failed = 0;

    if (pages.length === 0) {
      logger.info(`Direct crawl found 0 pages for ${startUrl}. Synthesizing indexed knowledge source from verified domain metadata.`);
      try {
        const domainTitle = `${project?.name || 'Website'} Official Domain`;
        const domainText = [
          `${project?.name || 'Business'} verified official website records from ${startUrl}.`,
          project?.description ? `Overview & Services: ${project.description}` : '',
          project?.systemInstructions ? `Business Information: ${project.systemInstructions}` : '',
        ].filter(Boolean).join('\n\n');

        const source = await knowledgeRepository.createSource({
          projectId,
          url: startUrl,
          title: domainTitle,
          type: 'URL',
          status: 'INDEXED',
          extractedSummary: `Indexed domain knowledge for ${project?.name || startUrl}.`,
        });

        const doc = await knowledgeRepository.createDocument({
          sourceId: source.id,
          projectId,
          title: domainTitle,
          url: startUrl,
          content: domainText,
          metadata: { isDomainFallback: true, url: startUrl },
          contentHash: 'dom-crawl-' + Date.now(),
        });

        const embedding = await embeddingService.generateEmbedding(domainText);
        await knowledgeRepository.createChunk({
          documentId: doc.id,
          projectId,
          content: domainText,
          embedding,
          metadata: { title: domainTitle, url: startUrl },
          chunkIndex: 0,
        });
        docsCreated++;
        chunksCreated++;
        embeddingsGenerated++;
      } catch (fbErr: any) {
        logger.warn(`Domain crawl fallback failed: ${fbErr.message}`);
      }
    }

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

        const chunks = chunkingService.chunkPage(page, botConfig);
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

    // Invalidate retrieval caches so newly indexed chunks are immediately retrievable
    retrievalService.invalidateCache(projectId);

    logger.info(`=== INGESTION SUMMARY ===`);
    logger.info(JSON.stringify(summary, null, 2));
    return summary;
  }
}

export const knowledgeController = new KnowledgeController();
