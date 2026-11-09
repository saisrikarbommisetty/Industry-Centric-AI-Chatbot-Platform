import * as cheerio from 'cheerio';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';
import { generateContentHash } from '../../utils/hash';
import { CrawledPage, ExtractedPropertyMetadata } from '../../types';

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

export class CrawlerService {
  private userAgent: string;
  private maxPages: number;

  constructor() {
    this.userAgent =
      process.env.CRAWLER_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; BusinessKnowledgeBot/1.0)';
    this.maxPages = ENV.MAX_CRAWL_PAGES || 50;
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
   * Crawl a domain starting from its base URL, discovering sitemaps and internal links
   */
  async crawlWebsite(startUrl: string, maxPagesOverride?: number, botConfig?: { industry?: string; botName?: string }): Promise<CrawledPage[]> {
    validateSafeUrl(startUrl);
    const limit = maxPagesOverride || this.maxPages;
    const baseDomain = new URL(startUrl).origin;
    const crawledPages: CrawledPage[] = [];
    const visitedUrls = new Set<string>();
    const queue: string[] = [];

    logger.info(`Starting website crawl for ${startUrl} (Max pages: ${limit})`);

    // 1. Discover URLs from sitemap.xml
    try {
      const sitemapUrls = await this.discoverSitemapUrls(startUrl);
      if (sitemapUrls.length > 0) {
        logger.info(`Discovered ${sitemapUrls.length} URLs from sitemap.`);
        for (const u of sitemapUrls) {
          if (!visitedUrls.has(u) && queue.length < limit * 2) {
            queue.push(u);
          }
        }
      }
    } catch (err: any) {
      logger.warn(`Sitemap discovery notice for ${startUrl}: ${err.message}`);
    }

    if (queue.length === 0) {
      queue.push(startUrl);
    }

    // 2. Process queue & discover internal links
    while (queue.length > 0 && crawledPages.length < limit) {
      const rawQueueUrl = queue.shift()!;
      let cleanUrl = rawQueueUrl.split('#')[0];
      try {
        const uObj = new URL(cleanUrl);
        if (!uObj.pathname || uObj.pathname === '') {
          uObj.pathname = '/';
        }
        cleanUrl = uObj.href;
      } catch {
        cleanUrl = rawQueueUrl;
      }

      if (visitedUrls.has(cleanUrl)) continue;
      visitedUrls.add(cleanUrl);

      // Verify same origin and SSRF safety
      try {
        const parsed = validateSafeUrl(cleanUrl);
        if (parsed.origin !== baseDomain) continue;
      } catch {
        continue;
      }

      logger.info(`Crawling [${crawledPages.length + 1}/${limit}]: ${cleanUrl}`);

      try {
        const page = await this.fetchAndExtractPage(cleanUrl, botConfig);
        if (page && page.extractedText.length > 50) {
          crawledPages.push(page);

          // Discover internal links to crawl beyond just sitemaps
          if (queue.length < limit * 3 && page.rawHtml) {
            try {
              const $page = cheerio.load(page.rawHtml);
              $page('a[href]').each((_, el) => {
                const href = $page(el).attr('href');
                if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
                try {
                  const resolved = new URL(href, cleanUrl);
                  if (resolved.origin === baseDomain && !isPrivateOrLocalAddress(resolved.hostname)) {
                    const cleanDiscovered = resolved.href.split('#')[0];
                    const ext = cleanDiscovered.split('.').pop()?.toLowerCase();
                    const ignoredExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'pdf', 'zip', 'mp4', 'mp3', 'css', 'js', 'json'];
                    if (!ignoredExts.includes(ext || '') && !visitedUrls.has(cleanDiscovered) && queue.length < limit * 3) {
                      queue.push(cleanDiscovered);
                    }
                  }
                } catch {
                  // Ignore invalid link
                }
              });
            } catch {
              // Ignore HTML parse link discovery error
            }
          }
        }
      } catch (err: any) {
        logger.warn(`Failed to crawl ${cleanUrl}: ${err.message}. Continuing...`);
      }
    }

    logger.info(`Crawling finished. Processed ${crawledPages.length} unique pages.`);
    return crawledPages;
  }

  /**
   * Discover URLs from sitemap.xml or robots.txt
   */
  async discoverSitemapUrls(baseUrl: string): Promise<string[]> {
    validateSafeUrl(baseUrl);
    const domain = new URL(baseUrl).origin;
    const sitemapCandidates = [
      `${domain}/sitemap.xml`,
      `${domain}/sitemap_index.xml`,
      `${domain}/property_area-sitemap.xml`,
      `${domain}/property-sitemap.xml`,
      `${domain}/page-sitemap.xml`,
      `${domain}/post-sitemap.xml`,
    ];

    const discoveredUrls: string[] = [];

    for (const smUrl of sitemapCandidates) {
      try {
        const res = await fetch(smUrl, {
          headers: { 'User-Agent': this.userAgent },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) continue;
        const xml = await res.text();

        // Check for sub-sitemaps
        const subSitemaps = [...xml.matchAll(/<loc>(https?:\/\/[^<]+\.xml)<\/loc>/gi)].map((m) => m[1]);
        if (subSitemaps.length > 0) {
          for (const sub of subSitemaps) {
            try {
              if (isPrivateOrLocalAddress(new URL(sub).hostname)) continue;
              const subRes = await fetch(sub, {
                headers: { 'User-Agent': this.userAgent },
                signal: AbortSignal.timeout(6000),
              });
              if (subRes.ok) {
                const subXml = await subRes.text();
                const urls = [...subXml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)].map((m) => m[1]);
                discoveredUrls.push(...urls);
              }
            } catch {
              // Ignore sub-sitemap error
            }
          }
        }

        // Check direct page URLs
        const directUrls = [...xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)]
          .map((m) => m[1])
          .filter((u) => !u.endsWith('.xml') && !u.endsWith('.png') && !u.endsWith('.jpg') && !u.endsWith('.pdf'));

        discoveredUrls.push(...directUrls);
      } catch {
        // Skip inaccessible sitemap
      }
    }

    // Deduplicate and filter relevant property & locality pages first
    const unique = Array.from(new Set(discoveredUrls));
    return unique.sort((a, b) => {
      // Prioritize property and locality listing pages
      const isAProperty = a.includes('flats-in') || a.includes('properties') || a.includes('projects');
      const isBProperty = b.includes('flats-in') || b.includes('properties') || b.includes('projects');
      if (isAProperty && !isBProperty) return -1;
      if (!isAProperty && isBProperty) return 1;
      return 0;
    });
  }

  /**
   * Fetch a single page and extract text and structured property details using Cheerio
   */
  async fetchAndExtractPage(url: string, botConfig?: { industry?: string; botName?: string }): Promise<CrawledPage | null> {
    validateSafeUrl(url);
    const res = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    return this.parseHtmlContent(url, html, botConfig);
  }

  /**
   * Parse HTML content, extracting structured property data first, then stripping boilerplate
   */
  parseHtmlContent(url: string, rawHtml: string, botConfig?: { industry?: string; botName?: string }): CrawledPage {
    const $ = cheerio.load(rawHtml);
    const isRealEstate = botConfig?.industry === 'real-estate' || url.includes('prycoons.com');

    // 1. Extract structured properties only if real estate or listing markup exists
    const structuredProperties = isRealEstate ? this.extractPropertiesFromDom($, url) : [];

    // 2. Extract page metadata
    const pageLevelMetadata = this.extractPageLevelMetadata($, url);
    if (structuredProperties.length > 0) {
      pageLevelMetadata.properties = structuredProperties;
    }

    // 3. Convert HTML tables into readable text blocks before removing tags
    $('table').each((_, tbl) => {
      const rows: string[] = [];
      $(tbl).find('tr').each((_, tr) => {
        const cells: string[] = [];
        $(tr).find('th, td').each((_, td) => {
          const txt = $(td).text().trim().replace(/\s+/g, ' ');
          if (txt) cells.push(txt);
        });
        if (cells.length > 0) rows.push(cells.join(' | '));
      });
      if (rows.length > 0) {
        $(tbl).replaceWith(`\n${rows.join('\n')}\n`);
      }
    });

    // 4. Remove boilerplate elements, navigation menus, sidebars, and filter dropdowns
    $(
      'script, style, noscript, nav, footer, header, svg, iframe, form, aside, ' +
      '.sidebar, .widget, .filter, .filters, .dropdown, .menu, .breadcrumbs, ' +
      '.pagination, .search, .elementor-widget-nav-menu, .elementor-location-header, ' +
      '.elementor-location-footer, .cookie-banner, .popup, select, option, button, ' +
      '.search-form, .navbar, #menu-main-menu'
    ).remove();

    const title = ($('title').text() || $('h1').first().text() || 'Website Page').trim().replace(/\s+/g, ' ');
    const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

    const headings: string[] = [];
    $('h1, h2, h3, h4').each((_, el) => {
      const hText = $(el).text().trim().replace(/\s+/g, ' ');
      if (hText.length > 2 && hText.length < 150) {
        headings.push(hText);
      }
    });

    // Clean body text
    const extractedText = $('body')
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

      // Image extraction (checking Houzez data-listing_image, data-src, data-lazy-src, srcset, src)
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

    // Check OpenGraph image
    const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    if (ogImage) {
      try {
        metadata.image = new URL(ogImage, sourceUrl).href;
      } catch {
        metadata.image = ogImage;
      }
    }

    // Check location from URL or headings
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

    // Check BHK from URL or text
    if (/5\s*bhk/i.test(urlLower) || /5\s*bhk/i.test(text)) metadata.propertyType = '5BHK';
    else if (/4\s*bhk/i.test(urlLower) || /4\s*bhk/i.test(text)) metadata.propertyType = '4BHK';
    else if (/3\s*bhk/i.test(urlLower) || /3\s*bhk/i.test(text)) metadata.propertyType = '3BHK';
    else if (/2\s*bhk/i.test(urlLower) || /2\s*bhk/i.test(text)) metadata.propertyType = '2BHK';

    // Parse amenities mentions
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
