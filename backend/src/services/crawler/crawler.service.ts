import * as cheerio from 'cheerio';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';
import { generateContentHash } from '../../utils/hash';
import { CrawledPage, ExtractedPropertyMetadata } from '../../types';
import { PdfExtractor } from '../../utils/pdfExtractor';
import { browserRendererService } from './browserRenderer.service';

export function isPrivateOrLocalAddress(hostname: string): boolean {
  const h = hostname.toLowerCase().trim();
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h === '::1' || h === '[::1]') return true;
  if (h === '169.254.169.254' || h === 'metadata.google.internal' || h.endsWith('.internal')) return true;

  // Check IPv4 ranges: 10.x, 127.x, 169.254.x, 172.16-31.x, 192.168.x
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true;
  if (/^0\./.test(h)) return true;

  // Check integer/hex ip representation (e.g. 2130706433 or 0x7f000001)
  if (/^\d+$/.test(h) || /^0x[0-9a-f]+$/i.test(h)) return true;

  return false;
}

export function validateSafeUrl(urlStr: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error(`Invalid URL format: "${urlStr}"`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Invalid URL protocol: "${parsed.protocol}". Only HTTP and HTTPS are permitted.`);
  }

  if (isPrivateOrLocalAddress(parsed.hostname)) {
    throw new Error(`Security Exception (SSRF): Crawling private, loopback, or metadata endpoints (${parsed.hostname}) is prohibited.`);
  }

  return parsed;
}

export interface CrawlQueueItem {
  url: string;
  depth: number;
  parentUrl?: string;
  isDownloadableResource?: boolean;
}

export interface CrawlExecutionReport {
  startUrl: string;
  maxPages: number;
  maxDepth: number;
  totalDiscovered: number;
  totalFetched: number;
  totalExtracted: number;
  totalPdfResources: number;
  totalDynamicPages: number;
  failedUrls: Array<{ url: string; error: string }>;
  pages: CrawledPage[];
}

export class CrawlerService {
  private userAgent: string;
  private maxPages: number;
  private maxDepth: number;
  private concurrency: number;

  constructor() {
    this.userAgent =
      process.env.CRAWLER_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; BusinessKnowledgeBot/2.0)';
    this.maxPages = ENV.MAX_CRAWL_PAGES || 50;
    this.maxDepth = 4;
    this.concurrency = 3;
  }

  /**
   * Validate if URL is safe from SSRF attacks (public method)
   */
  validateSafeUrl(urlStr: string): boolean {
    try {
      validateSafeUrl(urlStr);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detect crawl traps such as repeating path segments (/a/b/a/b) or excessive calendar cycles
   */
  public isCrawlTrap(urlStr: string): boolean {
    try {
      const u = new URL(urlStr);
      const segments = u.pathname.split('/').filter(Boolean);

      // Check repeating consecutive segments
      for (let i = 0; i < segments.length - 2; i++) {
        if (segments[i] === segments[i + 1] || segments[i] === segments[i + 2]) {
          return true;
        }
      }

      // Check excessive depth (> 8 segments)
      if (segments.length > 8) return true;

      // Check calendar / date loops
      if (/\b(?:year|month|day|date|week)=\d+/i.test(u.search) && segments.some((s) => /calendar|events|archive/i.test(s))) {
        return true;
      }

      return false;
    } catch {
      return true;
    }
  }

  /**
   * Clean and normalize URLs for deduplication
   */
  public normalizeUrl(rawUrl: string): string {
    try {
      const u = new URL(rawUrl.split('#')[0]);
      // Remove common marketing/tracking query parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', '_ga', 'ref', 'source'];
      trackingParams.forEach((p) => u.searchParams.delete(p));

      // Remove trailing slash if path is longer than /
      if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
        u.pathname = u.pathname.slice(0, -1);
      }
      return u.href;
    } catch {
      return rawUrl.split('#')[0];
    }
  }

  /**
   * Crawl a domain starting from its base URL, discovering sitemaps, internal links, and downloadable resources
   */
  async crawlWebsite(
    startUrl: string,
    maxPagesOverride?: number,
    botConfig?: { industry?: string; botName?: string; crawlDepth?: number }
  ): Promise<CrawledPage[]> {
    const report = await this.crawlWebsiteWithDiagnostics(startUrl, maxPagesOverride, botConfig);
    return report.pages;
  }

  /**
   * Comprehensive crawler returning detailed execution diagnostics and multi-format extracted pages
   */
  async crawlWebsiteWithDiagnostics(
    startUrl: string,
    maxPagesOverride?: number,
    botConfig?: { industry?: string; botName?: string; crawlDepth?: number }
  ): Promise<CrawlExecutionReport> {
    validateSafeUrl(startUrl);
    const limit = maxPagesOverride || this.maxPages;
    const maxDepth = botConfig?.crawlDepth || this.maxDepth;
    const baseDomain = new URL(startUrl).origin;

    const crawledPages: CrawledPage[] = [];
    const visitedUrls = new Set<string>();
    const failedUrls: Array<{ url: string; error: string }> = [];
    const queue: CrawlQueueItem[] = [];

    let totalPdfResources = 0;
    let totalDynamicPages = 0;

    logger.info(`Starting deep website crawl for ${startUrl} (Max pages: ${limit}, Max depth: ${maxDepth})`);

    // 1. Discover URLs from sitemaps and robots.txt
    try {
      const sitemapUrls = await this.discoverSitemapUrls(startUrl);
      if (sitemapUrls.length > 0) {
        logger.info(`Discovered ${sitemapUrls.length} URLs from sitemap.`);
        for (const u of sitemapUrls) {
          const norm = this.normalizeUrl(u);
          if (!visitedUrls.has(norm) && queue.length < limit * 3) {
            queue.push({ url: norm, depth: 1, parentUrl: startUrl });
          }
        }
      }
    } catch (err: any) {
      logger.warn(`Sitemap discovery notice for ${startUrl}: ${err.message}`);
    }

    if (queue.length === 0) {
      queue.push({ url: this.normalizeUrl(startUrl), depth: 0 });
    }

    // 2. Process queue with batch concurrency and rate-limiting
    while (queue.length > 0 && crawledPages.length < limit) {
      // Pick batch
      const batchSize = Math.min(this.concurrency, queue.length, limit - crawledPages.length);
      const batchItems = queue.splice(0, batchSize);

      const batchPromises = batchItems.map(async (item) => {
        const cleanUrl = this.normalizeUrl(item.url);
        if (visitedUrls.has(cleanUrl)) return null;
        visitedUrls.add(cleanUrl);

        if (this.isCrawlTrap(cleanUrl)) {
          logger.debug(`Skipping crawl trap: ${cleanUrl}`);
          return null;
        }

        // Verify same origin and SSRF safety
        try {
          const parsed = validateSafeUrl(cleanUrl);
          if (parsed.origin !== baseDomain) return null;
        } catch {
          return null;
        }

        logger.info(`Crawling [${crawledPages.length + 1}/${limit}] (depth ${item.depth}): ${cleanUrl}`);

        try {
          // If URL is a downloadable PDF resource
          if (cleanUrl.toLowerCase().endsWith('.pdf') || item.isDownloadableResource) {
            const pdfPage = await this.fetchAndExtractPdf(cleanUrl, item.parentUrl || startUrl);
            if (pdfPage && pdfPage.extractedText.length > 40) {
              totalPdfResources++;
              return { page: pdfPage, discoveredLinks: [] };
            }
            return null;
          }

          // Fetch and extract HTML page
          const page = await this.fetchAndExtractPage(cleanUrl, botConfig);
          if (!page || page.extractedText.length < 40) return null;

          if (page.metadata?.documentType === 'dynamic_spa') {
            totalDynamicPages++;
          }

          // Discover internal links if below max depth
          const discoveredLinks: string[] = [];
          if (item.depth < maxDepth && page.rawHtml) {
            try {
              const $page = cheerio.load(page.rawHtml);
              $page('a[href], link[rel="canonical"], link[rel="next"], [data-href]').each((_, el) => {
                const href = $page(el).attr('href') || $page(el).attr('data-href');
                if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
                try {
                  const resolved = new URL(href, cleanUrl);
                  if (resolved.origin === baseDomain && !isPrivateOrLocalAddress(resolved.hostname)) {
                    const normDiscovered = this.normalizeUrl(resolved.href);
                    const ext = normDiscovered.split('.').pop()?.toLowerCase();
                    const ignoredExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'zip', 'mp4', 'mp3', 'css', 'js', 'json', 'ico', 'woff', 'ttf'];
                    if (!ignoredExts.includes(ext || '')) {
                      discoveredLinks.push(normDiscovered);
                    }
                  }
                } catch {
                  // ignore invalid link
                }
              });
            } catch {
              // ignore html parse error
            }
          }

          return { page, discoveredLinks, depth: item.depth, url: cleanUrl };
        } catch (err: any) {
          failedUrls.push({ url: cleanUrl, error: err.message || 'Fetch failed' });
          logger.warn(`Failed to crawl ${cleanUrl}: ${err.message}. Continuing...`);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const res of batchResults) {
        if (!res) continue;
        crawledPages.push(res.page);

        // Queue newly discovered links
        if (res.discoveredLinks && res.discoveredLinks.length > 0 && queue.length < limit * 4) {
          const nextDepth = (res.depth || 0) + 1;
          for (const link of res.discoveredLinks) {
            if (!visitedUrls.has(link) && !queue.some((q) => q.url === link)) {
              const isPdf = link.toLowerCase().endsWith('.pdf');
              const isHighPriority = /(?:about|service|product|treatment|course|program|pricing|fee|cost|contact|faq|admission|curriculum|policy|amenit|doctor|team|faculty|schedule|catalog|brochure)/i.test(link);

              const queueItem: CrawlQueueItem = {
                url: link,
                depth: nextDepth,
                parentUrl: res.url,
                isDownloadableResource: isPdf,
              };

              if (isHighPriority) {
                // Prioritize high-value business links
                const insertIdx = Math.min(queue.length, 3);
                queue.splice(insertIdx, 0, queueItem);
              } else {
                queue.push(queueItem);
              }
            }
          }
        }
      }

      // Small pacing delay to respect website rate limits
      if (queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    }

    logger.info(`Crawling finished. Processed ${crawledPages.length} unique pages/documents. Failed: ${failedUrls.length}`);

    return {
      startUrl,
      maxPages: limit,
      maxDepth,
      totalDiscovered: visitedUrls.size + queue.length,
      totalFetched: visitedUrls.size,
      totalExtracted: crawledPages.length,
      totalPdfResources,
      totalDynamicPages,
      failedUrls,
      pages: crawledPages,
    };
  }

  /**
   * Discover URLs from sitemap.xml or robots.txt with fallback heuristics
   */
  async discoverSitemapUrls(baseUrl: string): Promise<string[]> {
    validateSafeUrl(baseUrl);
    const domain = new URL(baseUrl).origin;
    const sitemapCandidates = [
      `${domain}/sitemap.xml`,
      `${domain}/sitemap_index.xml`,
      `${domain}/wp-sitemap.xml`,
      `${domain}/sitemap/sitemap.xml`,
      `${domain}/page-sitemap.xml`,
      `${domain}/post-sitemap.xml`,
      `${domain}/category-sitemap.xml`,
      `${domain}/service-sitemap.xml`,
      `${domain}/product-sitemap.xml`,
      `${domain}/course-sitemap.xml`,
      `${domain}/property_area-sitemap.xml`,
      `${domain}/property-sitemap.xml`,
      `${domain}/sitemap1.xml`,
      `${domain}/sitemap_pages.xml`,
    ];

    // Try reading robots.txt for Sitemap declaration first
    try {
      const robotsRes = await fetch(`${domain}/robots.txt`, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(4000),
      });
      if (robotsRes.ok) {
        const robotsTxt = await robotsRes.text();
        const sitemapMatches = [...robotsTxt.matchAll(/Sitemap:\s*(https?:\/\/[^\s\r\n]+)/gi)].map((m) => m[1].trim());
        for (const sm of sitemapMatches) {
          if (!sitemapCandidates.includes(sm)) {
            sitemapCandidates.unshift(sm);
          }
        }
      }
    } catch {}

    const discoveredUrls: string[] = [];

    for (const smUrl of sitemapCandidates) {
      try {
        const res = await fetch(smUrl, {
          headers: { 'User-Agent': this.userAgent },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) continue;
        const xml = await res.text();

        // Check for sub-sitemaps (Sitemap Index)
        const subSitemaps = [...xml.matchAll(/<sitemap>\s*<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
        const xmlSubMatches =
          subSitemaps.length > 0
            ? subSitemaps
            : [...xml.matchAll(/<loc>\s*(https?:\/\/[^<\s]+\.xml(?:\.gz)?)\s*<\/loc>/gi)].map((m) => m[1].trim());

        if (xmlSubMatches.length > 0) {
          for (const sub of xmlSubMatches.slice(0, 10)) {
            try {
              if (isPrivateOrLocalAddress(new URL(sub).hostname)) continue;
              const subRes = await fetch(sub, {
                headers: { 'User-Agent': this.userAgent },
                signal: AbortSignal.timeout(5000),
              });
              if (subRes.ok) {
                const subXml = await subRes.text();
                const urls = [...subXml.matchAll(/<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
                discoveredUrls.push(...urls);
              }
            } catch {
              // Ignore sub-sitemap error
            }
          }
        }

        // Check direct page URLs with flexible whitespace matching
        const directUrls = [...xml.matchAll(/<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi)]
          .map((m) => m[1].trim())
          .filter(
            (u) =>
              !u.endsWith('.xml') &&
              !u.endsWith('.xml.gz') &&
              !u.endsWith('.png') &&
              !u.endsWith('.jpg') &&
              !u.endsWith('.jpeg') &&
              !u.endsWith('.svg')
          );

        discoveredUrls.push(...directUrls);
        if (discoveredUrls.length >= 120) break;
      } catch {
        // Skip inaccessible sitemap
      }
    }

    // Deduplicate and prioritize key informational pages across all industries
    const unique = Array.from(new Set(discoveredUrls.map((u) => this.normalizeUrl(u))));
    const highPriorityPatterns = [
      /about/i, /service/i, /product/i, /treatment/i, /course/i, /program/i,
      /pricing/i, /fee/i, /cost/i, /contact/i, /faq/i, /doctor/i, /specialt/i,
      /admission/i, /properties/i, /projects/i, /amenit/i, /policy/i, /catalog/i,
    ];

    return unique.sort((a, b) => {
      const aMatches = highPriorityPatterns.some((p) => p.test(a));
      const bMatches = highPriorityPatterns.some((p) => p.test(b));
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }

  /**
   * Fetch and extract downloadable PDF resource linked from website
   */
  async fetchAndExtractPdf(url: string, parentUrl: string): Promise<CrawledPage | null> {
    validateSafeUrl(url);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/pdf,*/*',
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const extractedText = PdfExtractor.extractTextFromBuffer(buffer);

      if (!extractedText || extractedText.length < 30) return null;

      const pathSegments = new URL(url).pathname.split('/').filter(Boolean);
      const rawTitle = pathSegments.pop()?.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ') || 'Downloadable PDF Resource';
      const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

      const contentHash = generateContentHash(extractedText);

      return {
        url,
        title: `${title} (Official Document)`,
        rawHtml: '',
        extractedText: `[Document Resource: ${title} | Source: ${url}]\n\n${extractedText}`,
        headings: [title, 'Document Content'],
        metaDescription: `Official downloadable PDF document from ${parentUrl}`,
        metadata: {
          sourceUrl: url,
          documentType: 'agency_service',
          description: `Downloadable resource linked from ${parentUrl}`,
        },
        contentHash,
      };
    } catch (err: any) {
      logger.warn(`Failed to fetch or parse PDF from ${url}: ${err.message}`);
      return null;
    }
  }

  /**
   * Fetch a single page with retries on transient errors, dynamic SPA rendering detection, and Cheerio parsing
   */
  async fetchAndExtractPage(url: string, botConfig?: { industry?: string; botName?: string }): Promise<CrawledPage | null> {
    validateSafeUrl(url);
    let attempts = 0;
    let lastError: Error | null = null;
    let html = '';

    while (attempts < 2) {
      attempts++;
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) {
          if (res.status === 429 || res.status >= 500) {
            // Transient backoff
            await new Promise((r) => setTimeout(r, 1000 * attempts));
            continue;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        html = await res.text();
        break;
      } catch (err: any) {
        lastError = err;
        if (attempts >= 2) break;
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    if (!html) {
      throw lastError || new Error(`Failed to fetch ${url}`);
    }

    // Check if page is an interactive/dynamic SPA page that benefits from browser rendering
    const rawTextSample = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (browserRendererService.isDynamicSpaPage(html, rawTextSample.length)) {
      try {
        const renderRes = await browserRendererService.renderDynamicPage(url, html);
        if (renderRes.renderedWithBrowser) {
          html = renderRes.html;
        }
      } catch {
        // Fall back to static HTML parsing
      }
    }

    return this.parseHtmlContent(url, html, botConfig);
  }

  /**
   * Parse HTML content, extracting structured tables, FAQs, images, breadcrumbs, JSON-LD, and semantic text
   */
  parseHtmlContent(url: string, rawHtml: string, botConfig?: { industry?: string; botName?: string }): CrawledPage {
    const $ = cheerio.load(rawHtml);
    const isRealEstate = botConfig?.industry === 'real-estate' || url.includes('prycoons.com');

    // 1. Extract Breadcrumbs
    const breadcrumbList: string[] = [];
    $('.breadcrumb li, ol.breadcrumb li, nav[aria-label="breadcrumb"] li, .breadcrumbs a').each((_, el) => {
      const txt = $(el).text().trim().replace(/\s+/g, ' ');
      if (txt && !breadcrumbList.includes(txt) && txt !== '/' && txt !== '>') {
        breadcrumbList.push(txt);
      }
    });

    // 2. Extract JSON-LD and Schema data (rich structured data for products, FAQs, organization, courses)
    const structuredKnowledgeBlocks: string[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const text = $(el).text().trim();
        if (!text) return;
        const parsed = JSON.parse(text);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (!item || typeof item !== 'object') continue;
          // Organization / LocalBusiness / Hospital
          if (item.name || item.telephone || item.email || item.address) {
            const parts = [
              item.name ? `Business / Organization: ${item.name}` : '',
              item.description ? `About: ${item.description}` : '',
              item.telephone ? `Phone: ${item.telephone}` : '',
              item.email ? `Email: ${item.email}` : '',
              item.address
                ? `Address: ${
                    typeof item.address === 'string'
                      ? item.address
                      : [item.address.streetAddress, item.address.addressLocality, item.address.addressRegion, item.address.postalCode]
                          .filter(Boolean)
                          .join(', ')
                  }`
                : '',
              item.priceRange ? `Price Range: ${item.priceRange}` : '',
            ].filter(Boolean);
            if (parts.length > 0) structuredKnowledgeBlocks.push(parts.join('\n'));
          }
          // FAQs
          if (item['@type'] === 'FAQPage' && Array.isArray(item.mainEntity)) {
            for (const faq of item.mainEntity) {
              const q = faq.name || faq.question;
              const a = faq.acceptedAnswer?.text || faq.answer;
              if (q && a) {
                structuredKnowledgeBlocks.push(`FAQ Question: ${q}\nFAQ Answer: ${String(a).replace(/<[^>]+>/g, ' ').trim()}`);
              }
            }
          }
          // Products / Courses / Services / MedicalBusiness
          if (item['@type'] === 'Product' || item['@type'] === 'Course' || item['@type'] === 'Service' || item['@type'] === 'Hospital') {
            const pName = item.name || item.title;
            const pDesc = item.description || '';
            const pPrice = item.offers?.price ? `${item.offers?.priceCurrency || ''} ${item.offers?.price}` : '';
            const pDetails = [
              pName ? `Offering / Product: ${pName}` : '',
              pDesc ? `Description: ${pDesc}` : '',
              pPrice ? `Pricing: ${pPrice}` : '',
            ]
              .filter(Boolean)
              .join('\n');
            if (pDetails) structuredKnowledgeBlocks.push(pDetails);
          }
        }
      } catch {}
    });

    // 3. Extract Next.js / React SPA preloaded state if available
    let spaPreloadedText = '';
    $('script#__NEXT_DATA__').each((_, el) => {
      try {
        const jsonText = $(el).text();
        const parsed = JSON.parse(jsonText);
        const pageProps = parsed?.props?.pageProps;
        if (pageProps && typeof pageProps === 'object') {
          const strings: string[] = [];
          const walk = (obj: any, depth = 0) => {
            if (depth > 5 || !obj) return;
            if (typeof obj === 'string') {
              const s = obj.trim();
              if (s.length > 25 && s.length < 1500 && !s.startsWith('http') && !s.includes('{') && !s.includes('class=')) {
                strings.push(s);
              }
            } else if (Array.isArray(obj)) {
              for (const it of obj) walk(it, depth + 1);
            } else if (typeof obj === 'object') {
              for (const k of Object.keys(obj)) walk(obj[k], depth + 1);
            }
          };
          walk(pageProps);
          if (strings.length > 0) {
            spaPreloadedText = Array.from(new Set(strings)).join('\n\n');
          }
        }
      } catch {}
    });

    // 4. Extract Images and Visual Captions
    const visualKnowledge: string[] = [];
    const imagesMeta: string[] = [];
    $('img[alt], img[title], figure').each((_, el) => {
      const $el = $(el);
      const alt = $el.attr('alt')?.trim();
      const title = $el.attr('title')?.trim();
      const caption = $el.find('figcaption').text().trim();
      const src = $el.attr('src') || $el.find('img').attr('src');

      const desc = [alt, title, caption].filter(Boolean).join(' - ');
      if (desc && desc.length > 5 && !desc.toLowerCase().includes('logo') && !desc.toLowerCase().includes('icon')) {
        let fullSrc = src || '';
        try {
          if (fullSrc) fullSrc = new URL(fullSrc, url).href;
        } catch {}
        visualKnowledge.push(`[Visual Asset: "${desc}"${fullSrc ? ` | Image: ${fullSrc}` : ''}]`);
        if (fullSrc) imagesMeta.push(fullSrc);
      }
    });

    // 5. Extract structured properties only if real estate or listing markup exists
    const structuredProperties = isRealEstate ? this.extractPropertiesFromDom($, url) : [];

    // 6. Extract page metadata
    const pageLevelMetadata = this.extractPageLevelMetadata($, url);
    if (structuredProperties.length > 0) {
      pageLevelMetadata.properties = structuredProperties;
    }
    if (imagesMeta.length > 0) {
      pageLevelMetadata.images = imagesMeta;
    }

    // 7. Convert HTML tables into readable structured markdown blocks before removing tags
    $('table').each((_, tbl) => {
      const rows: string[] = [];
      const caption = $(tbl).find('caption').text().trim();

      $(tbl).find('tr').each((_, tr) => {
        const cells: string[] = [];
        $(tr).find('th, td').each((_, td) => {
          const txt = $(td).text().trim().replace(/\s+/g, ' ');
          if (txt) cells.push(txt);
        });
        if (cells.length > 0) rows.push(cells.join(' | '));
      });
      if (rows.length > 0) {
        const captionPrefix = caption ? `\n### Table: ${caption}\n` : '\n';
        $(tbl).replaceWith(`${captionPrefix}\n[Table Content]\n${rows.join('\n')}\n\n`);
      }
    });

    // 8. Format headings, FAQs, accordions, and lists with proper semantic spacing before tag removal
    $('summary').each((_, el) => {
      const sText = $(el).text().trim().replace(/\s+/g, ' ');
      if (sText.length > 1) {
        $(el).replaceWith(`\n\n### FAQ: ${sText}\n`);
      }
    });

    $('.accordion-button, .accordion-header, [data-bs-toggle="collapse"], .collapse-title, .faq-question, .accordion-title').each((_, el) => {
      const aText = $(el).text().trim().replace(/\s+/g, ' ');
      if (aText.length > 2 && !aText.startsWith('###')) {
        $(el).replaceWith(`\n\n### ${aText}\n`);
      }
    });

    $('dt').each((_, el) => {
      const dtText = $(el).text().trim().replace(/\s+/g, ' ');
      if (dtText.length > 1) {
        $(el).replaceWith(`\n\n• **${dtText}**: `);
      }
    });

    $('dd').each((_, el) => {
      const ddText = $(el).text().trim().replace(/\s+/g, ' ');
      if (ddText.length > 1) {
        $(el).replaceWith(`${ddText}\n`);
      }
    });

    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const hText = $(el).text().trim().replace(/\s+/g, ' ');
      if (hText.length > 1) {
        $(el).replaceWith(`\n\n### ${hText}\n`);
      }
    });

    $('li').each((_, el) => {
      const liText = $(el).text().trim().replace(/\s+/g, ' ');
      if (liText.length > 1) {
        $(el).replaceWith(`\n• ${liText}\n`);
      }
    });

    $('p, blockquote').each((_, el) => {
      const pText = $(el).text().trim().replace(/\s+/g, ' ');
      if (pText.length > 1) {
        $(el).replaceWith(`\n\n${pText}\n`);
      }
    });

    // 9. Remove non-content elements (scripts, styles, tracking, popups, cookie banners)
    $(
      'script, style, noscript, svg, iframe, canvas, ' +
      '.cookie-banner, .cookie-notice, .popup, .modal-backdrop, .search-form, ' +
      '.elementor-location-header, .elementor-location-footer, #menu-main-menu'
    ).remove();

    const title = ($('title').text() || $('h1').first().text() || 'Website Page').trim().replace(/\s+/g, ' ');
    const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

    const headings: string[] = [];
    rawHtml.replace(/<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi, (_, h) => {
      const cleanH = h.replace(/<[^>]+>/g, '').trim();
      if (cleanH.length > 2 && cleanH.length < 150) headings.push(cleanH);
      return '';
    });

    // Clean body text
    let extractedText = $('body')
      .text()
      .replace(/(\r\n|\n|\r)/gm, '\n')
      .replace(/[ \t]+/g, ' ')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => {
        if (/Property Type\s*3BHK\s*4BHK\s*2BHK/i.test(l)) return false;
        if (/GandhinagarProperty Type/i.test(l)) return false;
        return l.length > 0;
      })
      .join('\n')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();

    // Combine with Breadcrumbs, Visual Assets, JSON-LD, and SPA preloaded data
    const auxiliarySections: string[] = [];
    if (breadcrumbList.length > 0) {
      auxiliarySections.push(`Navigation Path: ${breadcrumbList.join(' > ')}`);
    }
    if (visualKnowledge.length > 0) {
      auxiliarySections.push(visualKnowledge.slice(0, 6).join('\n'));
    }
    if (structuredKnowledgeBlocks.length > 0) {
      auxiliarySections.push(structuredKnowledgeBlocks.join('\n\n'));
    }
    if (spaPreloadedText) {
      auxiliarySections.push(spaPreloadedText);
    }
    if (metaDescription && !extractedText.includes(metaDescription)) {
      auxiliarySections.push(`Overview Summary: ${metaDescription}`);
    }

    if (auxiliarySections.length > 0) {
      extractedText = [extractedText, ...auxiliarySections].filter(Boolean).join('\n\n---\n\n').trim();
    }

    const contentHash = generateContentHash(extractedText);

    return {
      url,
      title,
      rawHtml,
      extractedText,
      headings,
      metaDescription,
      metadata: pageLevelMetadata,
      contentHash,
    };
  }

  /**
   * Extract individual property cards from Houzez theme markup before DOM stripping
   */
  private extractPropertiesFromDom($: cheerio.CheerioAPI, baseUrl: string): ExtractedPropertyMetadata[] {
    const properties: ExtractedPropertyMetadata[] = [];
    const knownAreas = [
      'Science City', 'Gota', 'Tragad', 'Chandkheda', 'Jagatpur', 'Vaishnodevi',
      'Zundal', 'Ognaj', 'Satellite', 'Shilaj', 'Sola', 'Thaltej', 'Bodakdev', 'Ambli',
      'GIFT City', 'Shela', 'Bopal', 'South Bopal', 'Prahlad Nagar', 'Vastrapur'
    ];

    // Houzez listing card selectors
    const cardSelectors = '.item-wrap, [data-listid], article.property-item, .item-listing-wrap, .property-card';
    const cardElements = $(cardSelectors);

    cardElements.each((_, el) => {
      const $card = $(el);

      // Title & URL
      const titleElem = $card.find('.item-title a, h2.item-title a, .item-title, h2.item-title, h3.item-title').first();
      let rawTitle = (titleElem.text() || '').trim().replace(/\s+/g, ' ');
      if (!rawTitle || rawTitle.length < 3) return;

      let detailUrl = '';
      $card.find('a[href*="/property/"]').each((_, a) => {
        const href = $(a).attr('href');
        if (href && href.includes('/property/') && !detailUrl) {
          detailUrl = href;
        }
      });
      if (!detailUrl) {
        detailUrl = titleElem.attr('href') || $card.find('a.hover-effect, a').first().attr('href') || baseUrl;
      }
      try {
        detailUrl = new URL(detailUrl, baseUrl).href;
      } catch {
        detailUrl = baseUrl;
      }

      // Developer extraction from title if "(by Developer)" pattern exists
      let projectName = rawTitle;
      let developer = 'Prycoons Developer Partner';
      const devMatch = rawTitle.match(/^(.+?)\s*\(\s*by\s+(.+?)\s*\)$/i);
      if (devMatch) {
        projectName = devMatch[1].trim();
        developer = devMatch[2].trim();
      }

      // Price extraction
      const priceElem = $card.find('.item-price-wrap .price, .item-price, .price, .item-sub-price, .h-price').first();
      let price = (priceElem.text() || '').trim().replace(/\s+/g, ' ');
      let priceNum = 0;

      if (!price) {
        const cardText = $card.text();
        const priceTextMatch = cardText.match(/₹\s*([0-9.]+)\s*(crore|cr|lakh|lac)/i);
        if (priceTextMatch) {
          price = priceTextMatch[0];
        }
      }

      if (price) {
        if (/crore|cr/i.test(price)) {
          const val = parseFloat(price.replace(/[^0-9.]/g, ''));
          if (!isNaN(val)) priceNum = val * 100;
        } else if (/lakh|lac/i.test(price)) {
          const val = parseFloat(price.replace(/[^0-9.]/g, ''));
          if (!isNaN(val)) priceNum = val;
        }
      }

      // Image extraction
      let imageUrl: string | undefined;
      const listingImgAttr = $card.attr('data-listing_image');
      if (listingImgAttr && listingImgAttr.startsWith('http')) {
        imageUrl = listingImgAttr;
      }

      if (!imageUrl) {
        const imgElem = $card.find('img.houzez-lazyload, img[data-src], img[data-lazy-src], img.wp-post-image, .item-thumb img, img').first();
        const candidateSrc =
          imgElem.attr('data-src') ||
          imgElem.attr('data-lazy-src') ||
          imgElem.attr('data-srcset')?.split(' ')[0] ||
          imgElem.attr('src');

        if (candidateSrc && !candidateSrc.includes('data:image') && !candidateSrc.includes('transparent.gif')) {
          try {
            imageUrl = new URL(candidateSrc, baseUrl).href;
          } catch {
            imageUrl = candidateSrc;
          }
        }
      }

      // Address & Location
      const addressElem = $card.find('.item-address, address, .item-sub-title').first();
      const address = (addressElem.text() || '').trim().replace(/\s+/g, ' ');
      let location = 'Ahmedabad';

      for (const area of knownAreas) {
        if (new RegExp(`\\b${area}\\b`, 'i').test(address) || new RegExp(`\\b${area}\\b`, 'i').test(rawTitle) || new RegExp(`\\b${area}\\b`, 'i').test(baseUrl)) {
          location = area;
          break;
        }
      }

      // BHK extraction
      const typeElem = $card.find('.h-type, .h-beds, .item-amenities .h-beds').first();
      let bhk = (typeElem.text() || '').trim();
      if (!bhk || !bhk.includes('BHK')) {
        const bhkMatch = (rawTitle + ' ' + $card.text()).match(/([0-9,\s–-]+BHK)/i);
        bhk = bhkMatch ? bhkMatch[1].trim() : '3 BHK';
      }

      // Area extraction
      const areaElem = $card.find('.h-area, .item-amenities .h-area').first();
      let carpetArea = (areaElem.text() || '').trim().replace(/\s+/g, ' ');
      if (!carpetArea || !carpetArea.includes('Sq')) {
        const areaMatch = $card.text().match(/([0-9\s–-]+(?:Sq Ft|sq\.ft\.|sqft))/i);
        if (areaMatch) carpetArea = areaMatch[1].trim();
      }

      // Status extraction
      const statusElem = $card.find('.label-status, .hz-label, .item-status').first();
      const propertyStatus = (statusElem.text() || '').trim() || 'Under Construction (RERA Approved)';

      // Amenities extraction
      const amenities: string[] = [];
      $card.find('.item-amenities li, .features li, [data-amenity]').each((_, amEl) => {
        const amText = $(amEl).text().trim();
        if (amText.length > 2 && amText.length < 40) {
          amenities.push(amText);
        }
      });

      // Avoid duplicates
      if (!properties.some((p) => p.projectName?.toLowerCase() === projectName.toLowerCase())) {
        properties.push({
          projectName,
          developer,
          location,
          city: 'Ahmedabad',
          propertyType: bhk.includes('2') ? '2BHK' : bhk.includes('4') ? '4BHK' : '3BHK',
          bhk,
          price: price || undefined,
          priceNum: priceNum || undefined,
          carpetArea: carpetArea || undefined,
          propertyStatus,
          address: address || `${location}, Ahmedabad`,
          sourceUrl: detailUrl,
          image: imageUrl,
          amenities,
          documentType: 'property_listing',
        });
      }
    });

    return properties;
  }

  /**
   * Extract page-level metadata including JSON-LD and OpenGraph tags
   */
  private extractPageLevelMetadata($: cheerio.CheerioAPI, sourceUrl: string): ExtractedPropertyMetadata {
    const metadata: ExtractedPropertyMetadata = {
      sourceUrl,
      documentType: 'property_listing',
      amenities: [],
      highlights: [],
    };

    const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    if (ogImage) {
      try {
        metadata.image = new URL(ogImage, sourceUrl).href;
      } catch {
        metadata.image = ogImage;
      }
    }

    const urlLower = sourceUrl.toLowerCase();
    const text = $('body').text();
    const knownAreas = ['gota', 'tragad', 'chandkheda', 'jagatpur', 'vaishnodevi', 'zundal', 'science city', 'sola', 'bodakdev', 'ambli', 'shela', 'satellite', 'bopal', 'gift city'];
    for (const area of knownAreas) {
      if (urlLower.includes(area) || text.toLowerCase().includes(`in ${area}`)) {
        metadata.location = area.charAt(0).toUpperCase() + area.slice(1);
        metadata.city = 'Ahmedabad';
        break;
      }
    }

    if (/5\s*bhk/i.test(urlLower) || /5\s*bhk/i.test(text)) metadata.propertyType = '5BHK';
    else if (/4\s*bhk/i.test(urlLower) || /4\s*bhk/i.test(text)) metadata.propertyType = '4BHK';
    else if (/3\s*bhk/i.test(urlLower) || /3\s*bhk/i.test(text)) metadata.propertyType = '3BHK';
    else if (/2\s*bhk/i.test(urlLower) || /2\s*bhk/i.test(text)) metadata.propertyType = '2BHK';

    const potentialAmenities = [
      'Gym', 'Landscaping', 'Garden', 'Swimming Pool', "Children's Play Area", 'Clubhouse',
      'EV Charging', 'High Speed Elevators', 'CCTV Security', 'Parking', 'Badminton Court', 'Jogging Track'
    ];
    for (const am of potentialAmenities) {
      if (new RegExp(`\\b${am}\\b`, 'i').test(text)) {
        metadata.amenities?.push(am);
      }
    }

    return metadata;
  }
}

export const crawlerService = new CrawlerService();
