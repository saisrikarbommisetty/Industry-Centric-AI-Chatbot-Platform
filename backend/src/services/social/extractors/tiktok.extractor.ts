import { BaseExtractor } from './base.extractor';
import { SocialExtractionResult, SocialPostMetadata, SocialPlatform } from '../socialMedia.types';
import { UrlNormalizer } from '../urlNormalizer';
import { logger } from '../../../utils/logger';

export class TikTokExtractor extends BaseExtractor {
  readonly platform: SocialPlatform = 'tiktok';
  readonly platformName = 'TikTok';

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
          title: 'TikTok Video Content',
          text: sanitized,
          hashtags: this.extractHashtags(sanitized),
          mediaType: 'video',
        },
      };
    }

    try {
      // 1. TikTok Official oEmbed API
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`;
      let oembedData: any = null;

      try {
        const oembedRes = await this.safeFetch(oembedUrl);
        if (oembedRes.ok) {
          oembedData = JSON.parse(oembedRes.text);
        }
      } catch (err: any) {
        logger.warn(`TikTok oEmbed note for ${canonicalUrl}: ${err.message}. Trying page metadata.`);
      }

      let title = oembedData?.title || '';
      let authorName = oembedData?.author_name || '';
      let authorUrl = oembedData?.author_url || '';
      let thumbnail = oembedData?.thumbnail_url || '';

      // 2. Open Graph Fallback
      if (!title) {
        try {
          const pageRes = await this.safeFetch(canonicalUrl);
          if (pageRes.ok) {
            const pageMeta = this.parseHtmlMeta(pageRes.text);
            title = pageMeta.title || pageMeta.description || '';
            if (!authorName) authorName = pageMeta.author || '';
            if (!thumbnail) thumbnail = pageMeta.image || '';
          }
        } catch (pageErr: any) {
          logger.warn(`TikTok HTML metadata fetch failed: ${pageErr.message}`);
        }
      }

      if (!title && !authorName) {
        return this.makeErrorResult(
          'CONTENT_UNAVAILABLE',
          'Could not retrieve publicly available information from this TikTok video. The video may be private, under age-restriction, or removed.',
          null,
          true
        );
      }

      const sanitizedText = this.sanitizeText(title);
      const hashtags = this.extractHashtags(title);

      const postData: SocialPostMetadata = {
        platform: this.platform,
        platformName: this.platformName,
        originalUrl: url,
        canonicalUrl,
        title: `TikTok by ${authorName || 'Creator'}`,
        caption: sanitizedText,
        text: sanitizedText,
        author: authorName,
        authorUrl,
        thumbnailUrl: thumbnail,
        hashtags,
        mediaType: 'video',
        rawMetadata: oembedData,
      };

      return {
        success: true,
        status: 'EXTRACTING',
        data: postData,
      };
    } catch (error: any) {
      logger.error(`TikTok extraction error for ${url}: ${error.message}`);
      return this.makeErrorResult(
        'EXTRACTION_FAILED',
        `Failed to retrieve TikTok video: ${error.message}. Please ensure the link is public.`,
        error
      );
    }
  }
}
