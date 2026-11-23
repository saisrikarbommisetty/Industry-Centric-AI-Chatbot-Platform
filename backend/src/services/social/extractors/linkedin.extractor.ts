import { BaseExtractor } from './base.extractor';
import { SocialExtractionResult, SocialPostMetadata, SocialPlatform } from '../socialMedia.types';
import { UrlNormalizer } from '../urlNormalizer';
import { logger } from '../../../utils/logger';

export class LinkedInExtractor extends BaseExtractor {
  readonly platform: SocialPlatform = 'linkedin';
  readonly platformName = 'LinkedIn';

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
          platformName: this.platformName,
          originalUrl: url,
          canonicalUrl,
          title: 'LinkedIn Post Content',
          text: sanitized,
          hashtags: this.extractHashtags(sanitized),
          mediaType: 'post',
        },
      };
    }

    try {
      const pageRes = await this.safeFetch(canonicalUrl);

      // Check if LinkedIn redirected to login / authwall
      const isAuthWall =
        pageRes.status === 401 ||
        pageRes.status === 403 ||
        pageRes.text.includes('authwall') ||
        pageRes.text.includes('linkedin.com/login') ||
        pageRes.text.includes('join-form');

      const pageMeta = this.parseHtmlMeta(pageRes.text);

      let contentText = pageMeta.description || '';
      let title = pageMeta.title || 'LinkedIn Post';
      let author = pageMeta.author || '';

      // Clean LinkedIn boilerplate from title/description
      if (title.includes(' | LinkedIn')) {
        title = title.replace(/\s*\|\s*LinkedIn$/i, '').trim();
      }

      if (contentText.includes('LinkedIn on ')) {
        contentText = contentText.replace(/^LinkedIn on\s*/i, '').trim();
      }

      if (isAuthWall && (!contentText || contentText.length < 20)) {
        return this.makeErrorResult(
          'PRIVATE_OR_RESTRICTED',
          'This LinkedIn post requires member authentication or is restricted to platform connections. Public content could not be accessed directly. You can paste the post text manually to index it.',
          null,
          true
        );
      }

      if (!contentText && !title) {
        return this.makeErrorResult(
          'CONTENT_UNAVAILABLE',
          'Could not retrieve content from this LinkedIn URL. The post may be deleted or private.',
          null,
          true
        );
      }

      const fullText = [
        title && title !== 'LinkedIn Post' ? `Title: ${title}` : '',
        author ? `Author: ${author}` : '',
        contentText ? `Content:\n${contentText}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const sanitized = this.sanitizeText(fullText || contentText || title);
      const hashtags = this.extractHashtags(`${title} ${contentText}`);

      const postData: SocialPostMetadata = {
        platform: this.platform,
        platformName: this.platformName,
        originalUrl: url,
        canonicalUrl,
        title,
        caption: contentText,
        text: sanitized,
        author,
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
      logger.error(`LinkedIn extraction error for ${url}: ${error.message}`);
      return this.makeErrorResult(
        'EXTRACTION_FAILED',
        `Failed to access LinkedIn post: ${error.message}. Please check whether the post is publicly accessible or provide the text manually.`,
        error
      );
    }
  }
}
