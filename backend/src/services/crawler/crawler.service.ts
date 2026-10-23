import * as cheerio from 'cheerio';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';
import { generateContentHash } from '../../utils/hash';
import { CrawledPage, ExtractedPropertyMetadata } from '../../types';

export class CrawlerService {
  private userAgent: string;
  private maxPages: number;

  constructor() {
    this.userAgent = ENV.CRAWLER_USER_AGENT;
    this.maxPages = ENV.MAX_CRAWL_PAGES || 50;
  }

  /**
   * Crawl a domain starting from its base URL, discovering sitemaps and internal links
   */
  async crawlWebsite(startUrl: string, maxPagesOverride?: number): Promise<CrawledPage[]> {
    const limit = maxPagesOverride || this.maxPages;
    const baseDomain = new URL(startUrl).origin;
    const crawledPages: CrawledPage[] = [];
    const visitedUrls = new Set<string>();
    const queue: string[] = [];

    logger.info(`Starting website crawl for ${startUrl} (Max pages: ${limit})`);

    // 1. Discover URLs from sitemap.xml
    const sitemapUrls = await this.discoverSitemapUrls(startUrl);
    if (sitemapUrls.length > 0) {
      logger.info(`Discovered ${sitemapUrls.length} URLs from sitemap.`);
      for (const u of sitemapUrls) {
        if (!visitedUrls.has(u) && queue.length < limit * 2) {
          queue.push(u);
        }
      }
    }

    if (queue.length === 0) {
      queue.push(startUrl);
    }

    // 2. Process queue
    while (queue.length > 0 && crawledPages.length < limit) {
      const url = queue.shift()!;
      const cleanUrl = url.split('#')[0].replace(/\/+$/, '') + '/';

      if (visitedUrls.has(cleanUrl)) continue;
      visitedUrls.add(cleanUrl);

      // Verify same origin
      try {
        const parsed = new URL(cleanUrl);
        if (parsed.origin !== baseDomain) continue;
      } catch {
        continue;
      }

      logger.info(`Crawling [${crawledPages.length + 1}/${limit}]: ${cleanUrl}`);

      try {
        const page = await this.fetchAndExtractPage(cleanUrl);
        if (page && page.extractedText.length > 50) {
          crawledPages.push(page);
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
  async fetchAndExtractPage(url: string): Promise<CrawledPage | null> {
    const res = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    return this.parseHtmlContent(url, html);
  }

  /**
   * Parse HTML content, extracting structured property data first, then stripping boilerplate
   */
  parseHtmlContent(url: string, rawHtml: string): CrawledPage {
    const $ = cheerio.load(rawHtml);

    // 1. Extract structured properties BEFORE stripping DOM
    const structuredProperties = this.extractPropertiesFromDom($, url);

    // 2. Also extract single page metadata (OG tags, JSON-LD)
    const pageLevelMetadata = this.extractPageLevelMetadata($, url);
    if (structuredProperties.length > 0) {
      pageLevelMetadata.properties = structuredProperties;
    }

    // 3. Remove boilerplate elements, navigation menus, sidebars, and filter dropdowns
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
