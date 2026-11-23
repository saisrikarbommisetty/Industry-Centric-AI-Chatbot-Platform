import { BaseExtractor } from './base.extractor';
import { SocialExtractionResult, SocialPostMetadata, SocialPlatform } from '../socialMedia.types';
import { UrlNormalizer } from '../urlNormalizer';
import { logger } from '../../../utils/logger';

export class InstagramExtractor extends BaseExtractor {
  readonly platform: SocialPlatform = 'instagram';
  readonly platformName = 'Instagram';

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
          title: 'Instagram Post Content',
          text: sanitized,
          hashtags: this.extractHashtags(sanitized),
          mediaType: canonicalUrl.includes('/reel/') ? 'reel' : 'post',
        },
      };
    }

    try {
      const pageRes = await this.safeFetch(canonicalUrl);

      const isLoginWall =
        pageRes.status === 401 ||
        pageRes.status === 403 ||
        pageRes.text.includes('accounts/login') ||
        pageRes.text.includes('Login • Instagram');

      const pageMeta = this.parseHtmlMeta(pageRes.text);

      let caption = '';
      let author = pageMeta.author || '';

      // Instagram Open Graph typically formats description as:
      // "<count> likes, <count> comments - <username> on <date>: \"<caption text>\""
      const ogDesc = pageMeta.description || '';
      if (ogDesc) {
        const quoteMatch = ogDesc.match(/: "([^"]+)"$/) || ogDesc.match(/:\s*“([^”]+)”$/);
        if (quoteMatch && quoteMatch[1]) {
          caption = quoteMatch[1];
        } else {
          caption = ogDesc;
        }

        const authorMatch = ogDesc.match(/-\s*([a-zA-Z0-9_.-]+)\s+on\s+/i);
        if (authorMatch && authorMatch[1] && !author) {
          author = authorMatch[1];
        }
      }

      // Check og:title for author info (e.g. "<username> on Instagram: '...'")
      const ogTitle = pageMeta.title || '';
      if (!author && ogTitle.includes(' on Instagram')) {
        author = ogTitle.split(' on Instagram')[0].trim();
      }

      if (isLoginWall && (!caption || caption.length < 15)) {
        return this.makeErrorResult(
          'PRIVATE_OR_RESTRICTED',
          'This Instagram post requires login to view or is from a private account. Public content could not be accessed. You can provide the caption text manually.',
          null,
          true
        );
      }

      if (!caption && !ogTitle) {
        return this.makeErrorResult(
          'CONTENT_UNAVAILABLE',
          'Could not retrieve publicly available content for this Instagram URL. Please verify the post is public.',
          null,
          true
        );
      }

      const fullText = [
        author ? `Instagram Post by: ${author}` : 'Instagram Post',
        caption ? `Caption:\n${caption}` : ogTitle,
      ]
        .filter(Boolean)
        .join('\n\n');

      const sanitized = this.sanitizeText(fullText || caption || ogTitle);
      const hashtags = this.extractHashtags(`${caption} ${ogTitle}`);

      const postData: SocialPostMetadata = {
        platform: this.platform,
        platformName: this.platformName,
        originalUrl: url,
        canonicalUrl,
        title: author ? `Instagram Post by ${author}` : 'Instagram Post',
        caption,
        text: sanitized,
        author,
        thumbnailUrl: pageMeta.image,
        hashtags,
        mediaType: canonicalUrl.includes('/reel/') ? 'reel' : 'post',
        rawMetadata: pageMeta,
      };

      return {
        success: true,
        status: 'EXTRACTING',
        data: postData,
      };
    } catch (error: any) {
      logger.error(`Instagram extraction error for ${url}: ${error.message}`);
      return this.makeErrorResult(
        'EXTRACTION_FAILED',
        `Failed to access Instagram post: ${error.message}. Please verify the URL or provide manual content.`,
        error
      );
    }
  }
}
