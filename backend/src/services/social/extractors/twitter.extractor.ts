import * as cheerio from 'cheerio';
import { BaseExtractor } from './base.extractor';
import { SocialExtractionResult, SocialPostMetadata, SocialPlatform } from '../socialMedia.types';
import { UrlNormalizer } from '../urlNormalizer';
import { logger } from '../../../utils/logger';

export class TwitterExtractor extends BaseExtractor {
  readonly platform: SocialPlatform = 'twitter';
  readonly platformName = 'X (Twitter)';

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
          title: 'Post on X (Twitter)',
          text: sanitized,
          hashtags: this.extractHashtags(sanitized),
          mediaType: 'tweet',
        },
      };
    }

    try {
      // 1. Official Twitter / X oEmbed API
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(canonicalUrl)}&omit_script=true`;
      let oembedData: any = null;

      try {
        const oembedRes = await this.safeFetch(oembedUrl);
        if (oembedRes.ok) {
          oembedData = JSON.parse(oembedRes.text);
        }
      } catch (err: any) {
        logger.warn(`Twitter oEmbed note for ${canonicalUrl}: ${err.message}. Trying direct Open Graph metadata.`);
      }

      let tweetText = '';
      let authorName = oembedData?.author_name || '';
      let authorUrl = oembedData?.author_url || '';

      if (oembedData && oembedData.html) {
        const $ = cheerio.load(oembedData.html);
        // Twitter oEmbed HTML contains a blockquote with the tweet text
        const blockquote = $('blockquote.twitter-tweet p').text().trim() || $('blockquote').text().trim();
        tweetText = blockquote || oembedData.html.replace(/<[^>]+>/g, ' ').trim();
      }

      // 2. Open Graph / Twitter Card fallback
      if (!tweetText) {
        try {
          const pageRes = await this.safeFetch(canonicalUrl);
          if (pageRes.ok) {
            const pageMeta = this.parseHtmlMeta(pageRes.text);
            tweetText = pageMeta.description || pageMeta.title || '';
            if (!authorName) authorName = pageMeta.author || '';
          }
        } catch (pageErr: any) {
          logger.warn(`Twitter page metadata fallback failed: ${pageErr.message}`);
        }
      }

      if (!tweetText && !authorName) {
        return this.makeErrorResult(
          'PRIVATE_OR_RESTRICTED',
          'This post on X (Twitter) could not be retrieved publicly. It may be from a protected/private account, deleted, or restricted.',
          null,
          true
        );
      }

      const sanitizedText = this.sanitizeText(tweetText);
      const hashtags = this.extractHashtags(tweetText);

      const postData: SocialPostMetadata = {
        platform: this.platform,
        platformName: this.platformName,
        originalUrl: url,
        canonicalUrl,
        title: `Post by ${authorName || 'user'} on X`,
        caption: sanitizedText,
        text: sanitizedText,
        author: authorName,
        authorUrl,
        hashtags,
        mediaType: 'tweet',
        rawMetadata: {
          url: oembedData?.url || canonicalUrl,
        },
      };

      return {
        success: true,
        status: 'EXTRACTING',
        data: postData,
      };
    } catch (error: any) {
      logger.error(`Twitter extraction error for ${url}: ${error.message}`);
      return this.makeErrorResult(
        'EXTRACTION_FAILED',
        `Failed to retrieve post from X (Twitter): ${error.message}. Please verify the post is public.`,
        error
      );
    }
  }
}
