import { BaseExtractor } from './base.extractor';
import { SocialExtractionResult, SocialPostMetadata, SocialPlatform } from '../socialMedia.types';
import { UrlNormalizer } from '../urlNormalizer';
import { logger } from '../../../utils/logger';

export class FacebookExtractor extends BaseExtractor {
  readonly platform: SocialPlatform = 'facebook';
  readonly platformName = 'Facebook';

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
          title: 'Facebook Post Content',
          text: sanitized,
          hashtags: this.extractHashtags(sanitized),
          mediaType: 'post',
        },
      };
    }

    try {
      const pageRes = await this.safeFetch(canonicalUrl);

      const isLoginWall =
        pageRes.status === 401 ||
        pageRes.status === 403 ||
        pageRes.text.includes('login.php') ||
        pageRes.text.includes('Log into Facebook');

      const pageMeta = this.parseHtmlMeta(pageRes.text);

      let text = pageMeta.description || '';
      let title = pageMeta.title || 'Facebook Post';
      let author = pageMeta.author || '';

      if (title.endsWith('| Facebook')) {
        title = title.replace(/\s*\|\s*Facebook$/i, '').trim();
      }

      if (isLoginWall && (!text || text.length < 15)) {
        return this.makeErrorResult(
          'PRIVATE_OR_RESTRICTED',
          'This Facebook post is private, restricted by group/audience permissions, or requires an authorized account to view. You can supply the text content manually.',
          null,
          true
        );
      }

      if (!text && !title) {
        return this.makeErrorResult(
          'CONTENT_UNAVAILABLE',
          'Could not retrieve content from this Facebook URL. Please ensure the post is set to Public.',
          null,
          true
        );
      }

      const fullText = [
        title && title !== 'Facebook Post' ? `Title: ${title}` : '',
        author ? `Author/Page: ${author}` : '',
        text ? `Content:\n${text}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const sanitized = this.sanitizeText(fullText || text || title);
      const hashtags = this.extractHashtags(`${text} ${title}`);

      const postData: SocialPostMetadata = {
        platform: this.platform,
        platformName: this.platformName,
        originalUrl: url,
        canonicalUrl,
        title,
        caption: text,
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
      logger.error(`Facebook extraction error for ${url}: ${error.message}`);
      return this.makeErrorResult(
        'EXTRACTION_FAILED',
        `Failed to access Facebook post: ${error.message}. Please check that the post is public.`,
        error
      );
    }
  }
}
