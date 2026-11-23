import * as cheerio from 'cheerio';
import { BaseExtractor } from './base.extractor';
import { SocialExtractionResult, SocialPostMetadata, SocialPlatform } from '../socialMedia.types';
import { UrlNormalizer } from '../urlNormalizer';
import { logger } from '../../../utils/logger';

export class GenericSocialExtractor extends BaseExtractor {
  readonly platform: SocialPlatform = 'other';
  readonly platformName = 'Other Platform';

  async extract(url: string, rawContent?: string): Promise<SocialExtractionResult> {
    const detection = UrlNormalizer.detectPlatform(url);
    const canonicalUrl = detection.canonicalUrl || url;

    if (rawContent && rawContent.trim().length > 10) {
      const sanitized = this.sanitizeText(rawContent);
      return {
        success: true,
        status: 'EXTRACTING',
        data: {
          platform: this.platform,
          platformName: detection.platformName || this.platformName,
          originalUrl: url,
          canonicalUrl,
          title: 'Social Media Content',
          text: sanitized,
          hashtags: this.extractHashtags(sanitized),
          mediaType: 'post',
        },
      };
    }

    try {
      const pageRes = await this.safeFetch(canonicalUrl);

      if (!pageRes.ok) {
        return this.makeErrorResult(
          'CONTENT_UNAVAILABLE',
          `Target web page returned status HTTP ${pageRes.status}. Content could not be retrieved.`,
          null,
          true
        );
      }

      const pageMeta = this.parseHtmlMeta(pageRes.text);
      const $ = cheerio.load(pageRes.text);

      // Extract article or main text if available
      $('script, style, noscript, nav, header, footer, iframe').remove();
      const articleText = $('article, main, .post-content, .entry-content').text().trim();
      const bodyText = articleText || $('body').text().trim();

      const title = pageMeta.title || $('title').text().trim() || 'Social Web Post';
      const description = pageMeta.description || '';
      const author = pageMeta.author || '';

      const contentSnippet = description || (bodyText.length > 50 ? bodyText.slice(0, 1500) : '');

      if (!contentSnippet && !title) {
        return this.makeErrorResult(
          'CONTENT_UNAVAILABLE',
          'Could not extract text content from the target URL.',
          null,
          true
        );
      }

      const fullText = [
        `Title: ${title}`,
        author ? `Author: ${author}` : '',
        contentSnippet ? `Content:\n${contentSnippet}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const sanitized = this.sanitizeText(fullText);
      const hashtags = this.extractHashtags(`${title} ${contentSnippet}`);

      const postData: SocialPostMetadata = {
        platform: this.platform,
        platformName: pageMeta.siteName || detection.platformName || this.platformName,
        originalUrl: url,
        canonicalUrl,
        title,
        description: contentSnippet,
        text: sanitized,
        author,
        thumbnailUrl: pageMeta.image,
        hashtags,
        mediaType: 'post',
        rawMetadata: pageMeta,
      };

      return {
        success: true,
        status: 'EXTRACTING',
        data: postData,
      };
    } catch (error: any) {
      logger.error(`Generic social extraction error for ${url}: ${error.message}`);
      return this.makeErrorResult(
        'EXTRACTION_FAILED',
        `Failed to extract content from ${url}: ${error.message}`,
        error
      );
    }
  }
}
