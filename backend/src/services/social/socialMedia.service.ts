import {
  SocialPlatform,
  SocialProcessingStatus,
  SocialExtractionResult,
  SocialMediaSourceDTO,
  SocialPostMetadata,
} from './socialMedia.types';
import { UrlNormalizer } from './urlNormalizer';
import { BaseExtractor } from './extractors/base.extractor';
import { YouTubeExtractor } from './extractors/youtube.extractor';
import { TwitterExtractor } from './extractors/twitter.extractor';
import { TikTokExtractor } from './extractors/tiktok.extractor';
import { LinkedInExtractor } from './extractors/linkedin.extractor';
import { InstagramExtractor } from './extractors/instagram.extractor';
import { FacebookExtractor } from './extractors/facebook.extractor';
import { GenericSocialExtractor } from './extractors/generic.extractor';
import { knowledgeRepository } from '../../repositories/knowledge.repository';
import { projectRepository } from '../../repositories/project.repository';
import { chunkingService } from '../rag/chunking.service';
import { embeddingService } from '../embeddings/embedding.service';
import { retrievalService } from '../rag/retrieval.service';
import { generateContentHash } from '../../utils/hash';
import { logger } from '../../utils/logger';

export class SocialMediaService {
  private extractors: Map<SocialPlatform, BaseExtractor> = new Map();
  private statusMap: Map<string, { status: SocialProcessingStatus; message?: string; updatedAt: Date }> = new Map();

  constructor() {
    this.registerExtractor(new YouTubeExtractor());
    this.registerExtractor(new TwitterExtractor());
    this.registerExtractor(new TikTokExtractor());
    this.registerExtractor(new LinkedInExtractor());
    this.registerExtractor(new InstagramExtractor());
    this.registerExtractor(new FacebookExtractor());
    this.registerExtractor(new GenericSocialExtractor());
  }

  private registerExtractor(extractor: BaseExtractor) {
    this.extractors.set(extractor.platform, extractor);
  }

  private getExtractor(platform: SocialPlatform): BaseExtractor {
    return this.extractors.get(platform) || this.extractors.get('other')!;
  }

  /**
   * Detect platform and validate URL without modifying state
   */
  public detectAndValidate(rawUrl: string) {
    const val = UrlNormalizer.validate(rawUrl);
    if (!val.isValid) {
      return {
        isValid: false,
        error: val.error,
        platform: 'other',
        platformName: 'Other Platform',
        canonicalUrl: rawUrl,
      };
    }

    const detection = UrlNormalizer.detectPlatform(rawUrl);
    return {
      isValid: true,
      platform: detection.platform,
      platformName: detection.platformName,
      canonicalUrl: detection.canonicalUrl,
      normalizedUrl: detection.normalizedUrl,
    };
  }

  /**
   * Preview social post content before indexing
   */
  public async preview(rawUrl: string, manualContent?: string): Promise<SocialExtractionResult> {
    const detection = UrlNormalizer.detectPlatform(rawUrl);
    if (!detection.isSupported && detection.error) {
      return {
        success: false,
        status: 'FAILED',
        error: {
          code: 'INVALID_URL',
          message: detection.error,
        },
      };
    }

    const extractor = this.getExtractor(detection.platform);
    return await extractor.extract(detection.canonicalUrl, manualContent);
  }

  /**
   * Check for duplicate URL in the same bot/project
   */
  public async findDuplicate(projectId: string, rawUrl: string): Promise<any | null> {
    const norm = UrlNormalizer.normalize(rawUrl);
    const detection = UrlNormalizer.detectPlatform(rawUrl);
    const canonical = detection.canonicalUrl;

    const sources = await knowledgeRepository.getSourcesByProjectId(projectId);
    for (const src of sources) {
      if (src.url === rawUrl || src.url === norm || src.url === canonical) {
        return src;
      }
      if (UrlNormalizer.isSameUrl(src.url, rawUrl)) {
        return src;
      }
    }
    return null;
  }

  /**
   * Add a social media source, extract content, chunk, embed, and index into RAG
   */
  public async addSource(params: {
    projectId: string;
    url: string;
    title?: string;
    platform?: string;
    manualContent?: string;
  }): Promise<{ source: any; isDuplicate?: boolean; extractionResult?: SocialExtractionResult }> {
    const { projectId, url, manualContent } = params;

    const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // 1. Validation & Platform Detection
    const detection = UrlNormalizer.detectPlatform(url);
    if (!detection.isSupported && detection.error) {
      throw new Error(detection.error);
    }

    const canonicalUrl = detection.canonicalUrl;

    // 2. Duplicate Detection (scoped strictly to current bot)
    const existing = await this.findDuplicate(project.id, canonicalUrl);
    if (existing) {
      logger.info(`Duplicate social media source detected for project ${project.id}: ${canonicalUrl}`);
      return {
        source: existing,
        isDuplicate: true,
      };
    }

    // 3. Create initial source record
    const sourceTitle = params.title || `${detection.platformName} Post`;
    const source = await knowledgeRepository.createSource({
      projectId: project.id,
      url: canonicalUrl,
      title: sourceTitle,
      type: 'SOCIAL_MEDIA',
      status: 'PENDING',
      size: 'Social Post',
      extractedSummary: `Public content from ${detection.platformName}`,
    });

    this.updateStatus(source.id, 'PENDING', 'Pending extraction');

    // 4. Run extraction & indexing pipeline
    const extractionResult = await this.processSource(project.id, source, manualContent);
    const updatedSource = (await knowledgeRepository.getSourceById(source.id)) || source;

    return {
      source: updatedSource,
      isDuplicate: false,
      extractionResult,
    };
  }

  /**
   * Core processing: Fetch, extract, chunk, embed, and store
   */
  public async processSource(
    projectId: string,
    source: any,
    manualContent?: string
  ): Promise<SocialExtractionResult> {
    const detection = UrlNormalizer.detectPlatform(source.url);
    const extractor = this.getExtractor(detection.platform);

    try {
      this.updateStatus(source.id, 'FETCHING', `Connecting to ${detection.platformName}...`);
      await knowledgeRepository.updateSource(source.id, { status: 'CRAWLING' });

      this.updateStatus(source.id, 'EXTRACTING', `Extracting public post information...`);
      const extraction = await extractor.extract(source.url, manualContent);

      if (!extraction.success || !extraction.data) {
        const errorMsg = extraction.error?.message || 'Content could not be accessed from this URL.';
        this.updateStatus(source.id, 'FAILED', errorMsg);
        await knowledgeRepository.updateSource(source.id, {
          status: 'FAILED',
          errorMessage: errorMsg,
        });
        return extraction;
      }

      this.updateStatus(source.id, 'PROCESSING', 'Sanitizing and preparing content for RAG knowledge base...');
      const post = extraction.data;

      // Anti-Prompt-Injection: Format strictly as untrusted external reference data
      const formattedKnowledgeBlock = this.formatKnowledgeDocument(post);
      const contentHash = generateContentHash(formattedKnowledgeBlock);

      // Clean up any stale documents & chunks previously associated with this source (e.g. on refresh)
      await knowledgeRepository.deleteSourceDocumentsAndChunks(source.id);

      // Create or update KnowledgeDocument
      const doc = await knowledgeRepository.createDocument({
        sourceId: source.id,
        projectId,
        title: post.title || `${post.platformName} Post by ${post.author || 'User'}`,
        url: post.originalUrl || source.url,
        content: formattedKnowledgeBlock,
        metadata: {
          projectId,
          sourceId: source.id,
          platform: post.platform,
          platformName: post.platformName,
          originalPostUrl: post.originalUrl,
          canonicalUrl: post.canonicalUrl,
          postTitle: post.title,
          author: post.author,
          authorUrl: post.authorUrl,
          publishedAt: post.publishedAt,
          thumbnailUrl: post.thumbnailUrl,
          hashtags: post.hashtags,
          mediaType: post.mediaType,
          contentType: 'social_media_post',
          indexingTimestamp: new Date().toISOString(),
        },
        contentHash,
      });

      // Clear any previous chunks for this document
      await knowledgeRepository.deleteDocumentChunks(doc.id);

      this.updateStatus(source.id, 'INDEXING', 'Generating vector embeddings and indexing into RAG pipeline...');

      // Chunk using chunkingService
      const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
      const isRealEstate = Boolean(
        project?.industry === 'real-estate' ||
        project?.industry === 'real_estate' ||
        project?.name?.toLowerCase().includes('prycoons')
      );
      const botConfig = { industry: project?.industry, botName: project?.name, isRealEstate };

      const syntheticPage = {
        url: post.originalUrl,
        title: post.title || `${post.platformName} Post`,
        rawHtml: '',
        extractedText: formattedKnowledgeBlock,
        headings: [post.title || `${post.platformName} Post`],
        metaDescription: post.caption || post.description || '',
        metadata: {
          platform: post.platform,
          author: post.author,
          sourceUrl: post.originalUrl,
          documentType: 'general_page' as const,
        },
        contentHash,
      };

      const chunks = chunkingService.chunkPage(syntheticPage, botConfig);
      let indexedCount = 0;

      for (const chunk of chunks) {
        const embedding = await embeddingService.generateEmbedding(chunk.content);
        await knowledgeRepository.createChunk({
          documentId: doc.id,
          projectId,
          content: chunk.content,
          embedding,
          metadata: {
            ...chunk.metadata,
            sourceTitle: post.title || `${post.platformName} Post`,
            sourceUrl: post.originalUrl,
            platform: post.platform,
            author: post.author,
            publishedAt: post.publishedAt,
            hashtags: post.hashtags,
            contentType: 'social_media_post',
          },
          chunkIndex: chunk.chunkIndex,
        });
        indexedCount++;
      }

      // Mark Indexed successfully
      const summaryText = `${post.platformName} post by ${post.author || 'creator'}: ${post.caption || post.title || 'Content indexed'} (${indexedCount} chunks).`;
      await knowledgeRepository.updateSource(source.id, {
        status: 'INDEXED',
        lastIndexedAt: new Date(),
        lastCrawledAt: new Date(),
        contentHash,
        extractedSummary: summaryText,
        title: post.title || source.title,
      });

      this.updateStatus(source.id, 'INDEXED', `Successfully indexed ${indexedCount} knowledge chunks.`);

      // Critical: Invalidate RAG retrieval cache so chatbot immediately answers using new post knowledge
      retrievalService.invalidateCache(projectId);

      logger.info(`Social media post indexed successfully for project ${projectId}: ${post.originalUrl} (${indexedCount} chunks)`);

      return {
        success: true,
        status: 'INDEXED',
        data: post,
      };
    } catch (err: any) {
      logger.error(`Error in processSource for ${source.id}: ${err.message}`);
      this.updateStatus(source.id, 'FAILED', err.message);
      await knowledgeRepository.updateSource(source.id, {
        status: 'FAILED',
        errorMessage: err.message,
      });
      return {
        success: false,
        status: 'FAILED',
        error: {
          code: 'INDEXING_FAILED',
          message: `Processing failed: ${err.message}`,
        },
      };
    }
  }

  /**
   * Re-fetch and refresh an existing social media source
   */
  public async refreshSource(projectId: string, sourceId: string): Promise<SocialExtractionResult> {
    const source = await knowledgeRepository.getSourceById(sourceId);
    if (!source || source.projectId !== projectId) {
      throw new Error('Social media source not found');
    }

    logger.info(`Refreshing social media source ${sourceId} for project ${projectId}`);
    return await this.processSource(projectId, source);
  }

  /**
   * Delete a social media source and remove associated documents, chunks, and caches
   */
  public async deleteSource(projectId: string, sourceId: string): Promise<boolean> {
    const source = await knowledgeRepository.getSourceById(sourceId);
    if (!source || source.projectId !== projectId) {
      throw new Error('Social media source not found or does not belong to project');
    }

    await knowledgeRepository.deleteSource(sourceId);
    this.statusMap.delete(sourceId);

    // Invalidate retrieval cache
    retrievalService.invalidateCache(projectId);
    logger.info(`Deleted social media source ${sourceId} from project ${projectId}`);
    return true;
  }

  /**
   * List all social media sources for a project
   */
  public async listSources(projectId: string): Promise<SocialMediaSourceDTO[]> {
    const project = (await projectRepository.findById(projectId)) || (await projectRepository.findBySlug(projectId));
    const targetId = project ? project.id : projectId;

    const sources = await knowledgeRepository.getSourcesByProjectId(targetId);
    const socialSources = sources.filter((s) => s.type === 'SOCIAL_MEDIA' || UrlNormalizer.detectPlatform(s.url).isSupported && s.type !== 'PDF');

    const dtos: SocialMediaSourceDTO[] = [];
    for (const src of socialSources) {
      const detection = UrlNormalizer.detectPlatform(src.url);
      const liveStatus = this.statusMap.get(src.id);

      dtos.push({
        id: src.id,
        projectId: src.projectId,
        platform: detection.platform,
        platformName: detection.platformName,
        url: src.url,
        canonicalUrl: detection.canonicalUrl,
        title: src.title,
        status: liveStatus?.status || (src.status as any) || 'INDEXED',
        size: src.size || 'Social Post',
        lastCrawledAt: src.lastCrawledAt,
        lastIndexedAt: src.lastIndexedAt,
        contentHash: src.contentHash,
        errorMessage: src.errorMessage,
        extractedSummary: src.extractedSummary,
        chunksCount: src._count?.documents ? src._count.documents * 2 : 2,
        createdAt: src.createdAt,
        updatedAt: src.updatedAt,
      });
    }

    return dtos;
  }

  /**
   * Format knowledge document text preserving security barriers against prompt injection
   */
  private formatKnowledgeDocument(post: SocialPostMetadata): string {
    const parts = [
      `=== SOCIAL MEDIA CONTENT RECORD (${post.platformName.toUpperCase()}) ===`,
      `Platform: ${post.platformName}`,
      post.author ? `Author / Account: ${post.author}` : '',
      post.authorUrl ? `Author Profile: ${post.authorUrl}` : '',
      post.publishedAt ? `Publication Date: ${post.publishedAt}` : '',
      `Original Post URL: ${post.originalUrl}`,
      post.title ? `Post Title: ${post.title}` : '',
      '',
      `[Verified Public Content]:`,
      post.text || post.caption || post.description || 'No additional text available.',
    ];

    if (post.hashtags && post.hashtags.length > 0) {
      parts.push('', `[Hashtags & Topics]: ${post.hashtags.join(', ')}`);
    }

    parts.push(
      '',
      `[Grounding Reference]: This content was published on ${post.platformName} at ${post.originalUrl}. Answer user questions accurately using these details.`
    );

    return parts.filter((p) => p !== undefined).join('\n').trim();
  }

  private updateStatus(sourceId: string, status: SocialProcessingStatus, message?: string) {
    this.statusMap.set(sourceId, {
      status,
      message,
      updatedAt: new Date(),
    });
  }

  public getLiveStatus(sourceId: string) {
    return this.statusMap.get(sourceId);
  }
}

export const socialMediaService = new SocialMediaService();
