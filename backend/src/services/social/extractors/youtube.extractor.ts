import * as cheerio from 'cheerio';
import { BaseExtractor } from './base.extractor';
import { SocialExtractionResult, SocialPostMetadata, SocialPlatform } from '../socialMedia.types';
import { UrlNormalizer } from '../urlNormalizer';
import { logger } from '../../../utils/logger';

export class YouTubeExtractor extends BaseExtractor {
  readonly platform: SocialPlatform = 'youtube';
  readonly platformName = 'YouTube';

  async extract(url: string, rawContent?: string): Promise<SocialExtractionResult> {
    const detection = UrlNormalizer.detectPlatform(url);
    const canonicalUrl = detection.canonicalUrl || url;

    // Direct content supplied by user
    if (rawContent && rawContent.trim().length > 10) {
      const sanitized = this.sanitizeText(rawContent);
      return {
        success: true,
        status: 'EXTRACTING',
        data: {
          platform: this.platform,
          platformName: this.platformName,
          originalUrl: url,
          canonicalUrl,
          title: 'YouTube Video Content',
          text: sanitized,
          hashtags: this.extractHashtags(sanitized),
          mediaType: 'video',
        },
      };
    }

    try {
      // 1. YouTube Official oEmbed API
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
      let oembedData: any = null;

      try {
        const oembedRes = await this.safeFetch(oembedUrl);
        if (oembedRes.ok) {
          oembedData = JSON.parse(oembedRes.text);
        }
      } catch (err: any) {
        logger.warn(`YouTube oEmbed note for ${canonicalUrl}: ${err.message}. Trying direct page scrape.`);
      }

      // 2. Fetch public HTML for metadata & description
      let pageMeta: any = {};
      try {
        const pageRes = await this.safeFetch(canonicalUrl);
        if (pageRes.ok) {
          pageMeta = this.parseHtmlMeta(pageRes.text);
        }
      } catch (err: any) {
        logger.warn(`YouTube page fetch notice for ${canonicalUrl}: ${err.message}`);
      }

      const title = oembedData?.title || pageMeta.title || 'YouTube Video';
      const author = oembedData?.author_name || pageMeta.author || 'YouTube Creator';
      const authorUrl = oembedData?.author_url;
      const thumbnailUrl = oembedData?.thumbnail_url || pageMeta.image;

      // Extract description from meta tags or video tags
      const description = pageMeta.description || '';
      const fullText = [
        `Title: ${title}`,
        author ? `Channel / Creator: ${author}` : '',
        description ? `Description: ${description}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      if (!title && !description && !rawContent) {
        return this.makeErrorResult(
          'CONTENT_UNAVAILABLE',
          'Could not retrieve publicly accessible information from this YouTube video URL. The video may be private, restricted, or unavailable.',
          null,
          true
        );
      }

      const postData: SocialPostMetadata = {
        platform: this.platform,
        platformName: this.platformName,
        originalUrl: url,
        canonicalUrl,
        title,
        description,
        text: this.sanitizeText(fullText),
        author,
        authorUrl,
        thumbnailUrl,
        hashtags: this.extractHashtags(`${title} ${description}`),
        mediaType: canonicalUrl.includes('/shorts/') ? 'short' : 'video',
        rawMetadata: {
          providerName: oembedData?.provider_name || 'YouTube',
          type: oembedData?.type || 'video',
        },
      };

      return {
        success: true,
        status: 'EXTRACTING',
        data: postData,
      };
    } catch (error: any) {
      logger.error(`YouTube extraction error for ${url}: ${error.message}`);
      return this.makeErrorResult(
        'EXTRACTION_FAILED',
        `Failed to access YouTube video content: ${error.message}. Please check that the URL is public.`,
        error
      );
    }
  }
}
