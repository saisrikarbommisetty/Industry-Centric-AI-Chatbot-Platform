import * as cheerio from 'cheerio';
import { UrlNormalizer } from '../urlNormalizer';
import { SocialErrorCode, SocialExtractionResult, SocialPlatform, SocialPostMetadata } from '../socialMedia.types';
import { logger } from '../../../utils/logger';

export interface FetchOptions {
  timeoutMs?: number;
  maxSizeBytes?: number;
  headers?: Record<string, string>;
}

export abstract class BaseExtractor {
  abstract readonly platform: SocialPlatform;
  abstract readonly platformName: string;

  /**
   * Main extraction entry point for the platform
   */
  abstract extract(url: string, rawContent?: string): Promise<SocialExtractionResult>;

  /**
   * Perform safe HTTP GET request with SSRF validation, timeout, and response size guards
   */
  protected async safeFetch(url: string, options: FetchOptions = {}): Promise<{ ok: boolean; status: number; text: string; contentType: string }> {
    const val = UrlNormalizer.validate(url);
    if (!val.isValid) {
      throw new Error(`SSRF / URL Security Violation: ${val.error}`);
    }

    const timeoutMs = options.timeoutMs || 8000;
    const maxSizeBytes = options.maxSizeBytes || 5 * 1024 * 1024; // 5MB limit
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; BRIMChatbotSocialExtractor/1.0)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          ...(options.headers || {}),
        },
      });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (text.length > maxSizeBytes) {
        throw new Error(`Response size exceeds limit of ${maxSizeBytes} bytes.`);
      }

      return {
        ok: response.ok,
        status: response.status,
        text,
        contentType,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Clean text and sanitize untrusted HTML/inputs
   */
  protected sanitizeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Extract hashtags from text
   */
  protected extractHashtags(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/#([a-zA-Z0-9_\u0080-\uFFFF]+)/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((h) => h.trim().toLowerCase())));
  }

  /**
   * Helper to parse Open Graph, Twitter cards, and Schema.org from HTML
   */
  protected parseHtmlMeta(html: string): {
    title?: string;
    description?: string;
    author?: string;
    siteName?: string;
    publishedTime?: string;
    keywords?: string;
    ogType?: string;
    image?: string;
  } {
    const $ = cheerio.load(html);
    const meta: Record<string, string> = {};

    $('meta').each((_, el) => {
      const property = $(el).attr('property') || $(el).attr('name') || '';
      const content = $(el).attr('content') || '';
      if (property && content) {
        meta[property.toLowerCase()] = content;
      }
    });

    // Check JSON-LD
    let jsonLdAuthor: string | undefined;
    let jsonLdHeadline: string | undefined;
    let jsonLdText: string | undefined;
    let jsonLdDate: string | undefined;

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item.author) {
            jsonLdAuthor = typeof item.author === 'string' ? item.author : item.author.name;
          }
          if (item.headline) jsonLdHeadline = item.headline;
          if (item.articleBody || item.text) jsonLdText = item.articleBody || item.text;
          if (item.datePublished) jsonLdDate = item.datePublished;
        }
      } catch {
        // ignore JSON-LD parse errors
      }
    });

    const title =
      jsonLdHeadline ||
      meta['og:title'] ||
      meta['twitter:title'] ||
      $('title').text().trim() ||
      undefined;

    const description =
      jsonLdText ||
      meta['og:description'] ||
      meta['twitter:description'] ||
      meta['description'] ||
      undefined;

    const author =
      jsonLdAuthor ||
      meta['article:author'] ||
      meta['author'] ||
      meta['twitter:creator'] ||
      undefined;

    return {
      title,
      description,
      author,
      siteName: meta['og:site_name'],
      publishedTime: jsonLdDate || meta['article:published_time'] || meta['og:published_time'],
      keywords: meta['keywords'] || meta['news_keywords'],
      ogType: meta['og:type'],
      image: meta['og:image'] || meta['twitter:image'],
    };
  }

  /**
   * Format error result consistently
   */
  protected makeErrorResult(
    code: SocialErrorCode,
    message: string,
    details?: any,
    userActionRequired = false
  ): SocialExtractionResult {
    return {
      success: false,
      status: 'FAILED',
      error: {
        code,
        message,
        details,
        userActionRequired,
      },
    };
  }
}
