import * as cheerio from 'cheerio';
import { prisma, isDatabaseConnected } from '../../config/database';
import { knowledgeRepository, notifyKnowledgeChange } from '../../repositories/knowledge.repository';
import { embeddingService } from '../embeddings/embedding.service';
import { logger } from '../../utils/logger';

export interface DynamicDiscoveryResult {
  status: 'ALREADY_INDEXED' | 'INDEXED' | 'NOT_FOUND' | 'EMPTY_PAGE' | 'NETWORK_ERROR';
  locality: string;
  propertyCount?: number;
  sourceUrl?: string;
  error?: string;
}

export class LocalityDiscoveryService {
  private sitemapCache: { urls: string[]; timestamp: number } | null = null;
  private readonly SITEMAP_TTL_MS = 60 * 60 * 1000; // 1 hour
  private readonly SITEMAP_URL = 'https://prycoons.com/property_area-sitemap.xml';
  private readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  /**
   * List of known non-Ahmedabad cities/regions to strictly enforce Ahmedabad-only geographic scope
   */
  private readonly OUTSIDE_CITIES = [
    'hyderabad', 'bengaluru', 'bangalore', 'mumbai', 'bombay', 'pune', 'delhi',
    'new delhi', 'gurgaon', 'gurugram', 'noida', 'chennai', 'madras', 'kolkata',
    'calcutta', 'jaipur', 'surat', 'vadodara', 'baroda', 'rajkot', 'lucknow',
    'chandigarh', 'kochi', 'cochin', 'goa', 'indore', 'bhopal', 'nagpur',
    'patna', 'kanpur', 'thane', 'navi mumbai', 'nashik', 'agra', 'varanasi',
    'visakhapatnam', 'vizag', 'coimbatore', 'trivandrum', 'thiruvananthapuram',
    'mysore', 'mysuru', 'bhubaneswar', 'mangalore', 'amritsar', 'dehradun',
    'dubai', 'london', 'new york', 'toronto', 'singapore'
  ];

  /**
   * Determine if the user's message or requested location refers to a location outside Ahmedabad.
   * Accurately distinguishes "bhopal" (MP) from "bopal" (Ahmedabad locality).
   */
  isOutsideAhmedabad(text: string): { isOutside: boolean; city?: string } {
    if (!text) return { isOutside: false };
    const tl = text.toLowerCase();

    // Guard: If explicitly refers to Bopal / South Bopal, it is Ahmedabad!
    if (/\b(south\s+bopal|bopal)\b/i.test(tl) && !/\bbhopal\b/i.test(tl)) {
      return { isOutside: false };
    }

    for (const city of this.OUTSIDE_CITIES) {
      const reg = new RegExp(`\\b${city.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (reg.test(tl)) {
        const displayCity = city.charAt(0).toUpperCase() + city.slice(1);
        return { isOutside: true, city: displayCity };
      }
    }

    return { isOutside: false };
  }

  /**
   * Fetch and cache area URLs from Prycoons area sitemap
   */
  async getSitemapAreaUrls(): Promise<string[]> {
    if (this.sitemapCache && Date.now() - this.sitemapCache.timestamp < this.SITEMAP_TTL_MS) {
      return this.sitemapCache.urls;
    }

    try {
      const res = await fetch(this.SITEMAP_URL, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const xml = await res.text();
        const urls = [...xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)]
          .map((m) => m[1].trim())
          .filter(Boolean);

        if (urls.length > 0) {
          this.sitemapCache = { urls, timestamp: Date.now() };
          logger.info(`Loaded ${urls.length} area URLs from Prycoons area sitemap.`);
          return urls;
        }
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch area sitemap (${err.message}). Using fallback pattern generation.`);
    }

    return this.sitemapCache?.urls || [];
  }

  /**
   * Dynamically generate candidate Prycoons URLs for any given Ahmedabad locality name
   */
  async getCandidateUrlsForLocality(locality: string): Promise<string[]> {
    const raw = locality.trim().toLowerCase();
    const cleanSlug = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const compactSlug = raw.replace(/[^a-z0-9]+/g, '');

    const candidates: string[] = [];

    // 1. Check sitemap entries for matches
    const sitemapUrls = await this.getSitemapAreaUrls();
    for (const sUrl of sitemapUrls) {
      const urlLower = sUrl.toLowerCase();
      if (
        urlLower.includes(`/${cleanSlug}/`) ||
        urlLower.includes(`properties-in-${cleanSlug}-ahmedabad`) ||
        urlLower.includes(`/${compactSlug}/`) ||
        urlLower.includes(`properties-in-${compactSlug}-ahmedabad`) ||
        (cleanSlug.length > 3 && urlLower.includes(cleanSlug))
      ) {
        if (!candidates.includes(sUrl)) {
          candidates.push(sUrl);
        }
      }
    }

    // Special mappings for known variations (e.g. Bopal -> South Bopal)
    if (raw === 'bopal' || raw.includes('bopal')) {
      const southBopalUrl = 'https://prycoons.com/area/properties-in-south-bopal-ahmedabad/';
      if (!candidates.includes(southBopalUrl)) candidates.unshift(southBopalUrl);
    }
    if (raw === 'prahlad nagar' || raw === 'prahladnagar') {
      const pnUrl = 'https://prycoons.com/area/prahladnagar/';
      if (!candidates.includes(pnUrl)) candidates.unshift(pnUrl);
    }
    if (raw === 'vastrapur') {
      const vUrl = 'https://prycoons.com/area/vastrapur/';
      if (!candidates.includes(vUrl)) candidates.unshift(vUrl);
    }

    // 2. Add standard known Prycoons URL patterns
    const patterns = [
      `https://prycoons.com/properties-in-${cleanSlug}-ahmedabad/`,
      `https://prycoons.com/area/properties-in-${cleanSlug}-ahmedabad/`,
      `https://prycoons.com/area/${cleanSlug}/`,
      `https://prycoons.com/area/${compactSlug}/`,
      `https://prycoons.com/area/${cleanSlug}-ahmedabad/`,
      `https://prycoons.com/properties-in-${compactSlug}-ahmedabad/`,
    ];

    for (const p of patterns) {
      if (!candidates.includes(p)) {
        candidates.push(p);
      }
    }

    return candidates;
  }

  /**
   * Attempt to discover, fetch, and extract properties from a verified Prycoons listing page
   */
  async discoverLocalityPage(locality: string): Promise<{ url: string; html: string } | { networkError: string } | null> {
    const candidateUrls = await this.getCandidateUrlsForLocality(locality);
    let networkErrorCount = 0;
    let lastNetworkError = '';

    for (const testUrl of candidateUrls) {
      try {
        const res = await fetch(testUrl, {
          headers: {
            'User-Agent': this.USER_AGENT,
            Accept: 'text/html,application/xhtml+xml',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(6000),
        });

        if (res.status === 200) {
          const html = await res.text();
          // Check that the page is not an empty generic page
          const hasListingItems =
            html.includes('item-wrap') ||
            html.includes('data-listid') ||
            html.includes('property-item') ||
            html.includes('item-listing-wrap') ||
            html.includes('item-price');

          if (hasListingItems) {
            logger.info(`Discovered valid Prycoons locality page for "${locality}": ${res.url}`);
            return { url: res.url, html };
          }
        }
      } catch (err: any) {
        // Distinguish network/timeout errors from 404
        if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
          networkErrorCount++;
          lastNetworkError = err.message;
        }
      }
    }

    if (networkErrorCount > 0 && networkErrorCount === candidateUrls.length) {
      return { networkError: lastNetworkError };
    }

    return null;
  }

  /**
   * Extract structured property listings from discovered HTML
   */
  parsePropertiesFromHtml(html: string, pageUrl: string, localityName: string): any[] {
    const $ = cheerio.load(html);
    const properties: any[] = [];
    const seenTitles = new Set<string>();

    const cardSelectors = '.item-wrap, [data-listid], article.property-item, .item-listing-wrap, .property-card';
    $(cardSelectors).each((_, el) => {
      const $card = $(el);

      const titleElem = $card.find('.item-title a, h2.item-title a, .item-title, h2.item-title, h3.item-title').first();
      let rawTitle = (titleElem.text() || '').trim().replace(/\s+/g, ' ');
      if (!rawTitle || rawTitle.length < 3) return;

      // Deduplicate duplicate markup cards
      const normTitle = rawTitle.toLowerCase();
      if (seenTitles.has(normTitle)) return;
      seenTitles.add(normTitle);

      // Detail URL
      let detailUrl = '';
      $card.find('a[href*="/property/"]').each((_, a) => {
        const href = $(a).attr('href');
        if (href && href.includes('/property/') && !detailUrl) {
          detailUrl = href;
        }
      });
      if (!detailUrl) {
        detailUrl = titleElem.attr('href') || pageUrl;
      }
      try {
        detailUrl = new URL(detailUrl, pageUrl).href;
      } catch {
        detailUrl = pageUrl;
      }

      // Developer extraction
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
        if (priceTextMatch) price = priceTextMatch[0];
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
      let image: string | undefined;
      const listingImgAttr = $card.attr('data-listing_image');
      if (listingImgAttr && listingImgAttr.startsWith('http')) {
        image = listingImgAttr;
      }
      if (!image) {
        const imgElem = $card.find('img.houzez-lazyload, img[data-src], img[data-lazy-src], img.wp-post-image, .item-thumb img, img').first();
        const candidateSrc =
          imgElem.attr('data-src') ||
          imgElem.attr('data-lazy-src') ||
          imgElem.attr('data-srcset')?.split(' ')[0] ||
          imgElem.attr('src');
        if (candidateSrc && !candidateSrc.includes('data:image') && !candidateSrc.includes('transparent.gif')) {
          try {
            image = new URL(candidateSrc, pageUrl).href;
          } catch {
            image = candidateSrc;
          }
        }
      }

      // BHK extraction
      let bhk = '';
      const titleBhk = rawTitle.match(/\b([1-5](?:\s*[,&/–-]\s*[1-5])*\s*BHK)\b/i);
      if (titleBhk) {
        bhk = titleBhk[1].trim();
      } else {
        const bedsElem = $card.find('.h-beds, .item-amenities .h-beds, [data-amenity="beds"]').first();
        const bedsRaw = (bedsElem.text() || '').replace(/beds?:?/i, '').trim();
        const bedsMatch = bedsRaw.match(/([1-5](?:\s*[,&/–-]\s*[1-5])*)/);
        if (bedsMatch && bedsMatch[1]) {
          bhk = `${bedsMatch[1].trim()} BHK`;
        } else {
          const cardCleanText = $card.text().replace(/\s+/g, ' ');
          const cardBhkMatch = cardCleanText.match(/\b([1-5](?:\s*[,&/–-]\s*[1-5])*\s*BHK)\b/i);
          bhk = cardBhkMatch ? cardBhkMatch[1].trim() : '3 BHK';
        }
      }

      // Area extraction
      const areaElem = $card.find('.h-area, .item-amenities .h-area').first();
      let carpetArea = (areaElem.text() || '').trim().replace(/\s+/g, ' ');
      if (!carpetArea || !carpetArea.includes('Sq')) {
        const areaMatch = $card.text().match(/([0-9\s–-]+(?:Sq Ft|sq\.ft\.|sqft))/i);
        if (areaMatch) carpetArea = areaMatch[1].trim();
      }

      // Address
      const addressElem = $card.find('.item-address, address, .item-sub-title').first();
      const address = (addressElem.text() || '').trim().replace(/\s+/g, ' ') || `${localityName}, Ahmedabad`;

      // Status
      const statusElem = $card.find('.label-status, .hz-label, .item-status').first();
      const status = (statusElem.text() || '').trim() || 'Under Construction (RERA Approved)';

      properties.push({
        id: `card-${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        title: projectName,
        projectName,
        developer,
        location: localityName,
        city: 'Ahmedabad',
        bhk,
        price: price || 'Price on request',
        priceRange: price || 'Price on request',
        priceNum,
        carpetArea: carpetArea || 'Super Built Up Area',
        status,
        address,
        propertyDetailUrl: detailUrl,
        sourceUrl: detailUrl,
        image,
        chunkType: 'PROPERTY_CARD',
      });
    });

    return properties;
  }

  /**
   * Check if a locality has already been indexed in PostgreSQL
   */
  async isLocalityIndexed(locality: string, projectId: string): Promise<boolean> {
    if (!isDatabaseConnected) return false;
    try {
      const chunks = await prisma.knowledgeChunk.findMany({
        where: { projectId },
        select: { metadata: true },
        take: 500,
      });

      const targetLower = locality.toLowerCase();
      let matchCount = 0;
      for (const c of chunks) {
        const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : (c.metadata || {});
        const loc = (meta.location || '').toLowerCase();
        if ((loc === targetLower || loc.includes(targetLower)) && (meta.projectName || meta.title) && meta.bhk) {
          matchCount++;
          if (matchCount >= 2) return true;
        }
      }
    } catch (err: any) {
      logger.warn(`isLocalityIndexed DB check error: ${err.message}`);
    }
    return false;
  }

  /**
   * Discover and ingest properties for any Ahmedabad locality dynamically.
   * If already indexed, returns 'ALREADY_INDEXED'.
   * If page exists on Prycoons, ingests it and returns 'INDEXED'.
   * If 404, returns 'NOT_FOUND'.
   * If network error, returns 'NETWORK_ERROR'.
   */
  async discoverAndIndexLocality(locality: string, projectId = 'prycoons-ai', forceReindex = false): Promise<DynamicDiscoveryResult> {
    if (!locality || locality.toLowerCase() === 'ahmedabad') {
      return { status: 'ALREADY_INDEXED', locality };
    }

    const normLocality = locality.charAt(0).toUpperCase() + locality.slice(1);

    // 1. Check if already indexed (unless forceReindex is true)
    if (!forceReindex) {
      const alreadyIndexed = await this.isLocalityIndexed(locality, projectId);
      if (alreadyIndexed) {
        return { status: 'ALREADY_INDEXED', locality: normLocality };
      }
    }

    logger.info(`🔍 Performing Dynamic Locality Discovery for: "${locality}"...`);

    // 2. Discover live Prycoons page
    const pageResult = await this.discoverLocalityPage(locality);

    if (!pageResult) {
      logger.info(`No Prycoons page discovered for locality: "${locality}".`);
      return { status: 'NOT_FOUND', locality: normLocality };
    }

    if ('networkError' in pageResult) {
      logger.warn(`Network error during locality discovery for "${locality}": ${pageResult.networkError}`);
      return { status: 'NETWORK_ERROR', locality: normLocality, error: pageResult.networkError };
    }

    const { url, html } = pageResult;
    const properties = this.parsePropertiesFromHtml(html, url, normLocality);

    if (properties.length === 0) {
      logger.info(`Discovered page ${url} for "${locality}" has 0 listing cards.`);
      return { status: 'EMPTY_PAGE', locality: normLocality, sourceUrl: url };
    }

    logger.info(`Discovered ${properties.length} live properties for "${normLocality}". Ingesting into RAG index...`);

    // 3. Index discovered properties into PostgreSQL knowledge base
    try {
      const slug = locality.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const sourceId = `src-dynamic-${slug}-${Date.now()}`;
      const docId = `doc-dynamic-${slug}-${Date.now()}`;

      // Create Knowledge Source
      await knowledgeRepository.createSource({
        id: sourceId,
        projectId,
        url,
        title: `Properties in ${normLocality}, Ahmedabad | Prycoons Real Estate`,
        type: 'URL',
        status: 'INDEXED',
        size: `${properties.length * 15} KB`,
        extractedSummary: `Verified property listings in ${normLocality}, Ahmedabad discovered dynamically from Prycoons.`,
      });

      // Create Knowledge Document
      const docSummary = properties
        .map((p) => `${p.projectName} – ${p.bhk} in ${normLocality}, ${p.price}`)
        .join('\n');

      await knowledgeRepository.createDocument({
        id: docId,
        sourceId,
        projectId,
        title: `Properties in ${normLocality} Ahmedabad`,
        url,
        content: docSummary,
        metadata: {
          location: normLocality,
          city: 'Ahmedabad',
          propertyCount: properties.length,
          dynamicDiscovery: true,
        },
        contentHash: `hash-dynamic-${slug}-${Date.now()}`,
      });

      // Create Chunks for each property with vector embeddings
      for (let i = 0; i < properties.length; i++) {
        const p = properties[i];
        const pSlug = p.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const chunkId = `chk-dyn-${slug}-${pSlug}-${i}`;

        const chunkContent = `
Project: ${p.projectName}
Developer: ${p.developer || 'Prycoons Developer Partner'}
Location: ${normLocality}, Ahmedabad
Configuration: ${p.bhk}
Price: ${p.price}
Area: ${p.carpetArea}
Status: ${p.status}
Amenities: ${(p.amenities || []).join(', ')}
Address: ${p.address}
Source: ${p.propertyDetailUrl}
Verified Listing: Verified live listing on Prycoons Real Estate for ${normLocality}.
`.trim();

        const meta = {
          title: p.projectName,
          projectName: p.projectName,
          developer: p.developer,
          location: normLocality,
          city: 'Ahmedabad',
          propertyType: p.bhk?.includes('2') ? '2BHK' : p.bhk?.includes('4') ? '4BHK' : '3BHK',
          bhk: p.bhk,
          price: p.price,
          priceRange: p.price,
          priceNum: p.priceNum,
          carpetArea: p.carpetArea,
          propertyStatus: p.status,
          amenities: p.amenities || ['Landscaped Garden', 'Gymnasium', '24/7 Security'],
          sourceUrl: p.propertyDetailUrl,
          propertyDetailUrl: p.propertyDetailUrl,
          image: p.image,
          propertyImageUrl: p.image,
          chunkType: 'PROPERTY_CARD',
          documentType: 'property_listing',
          dynamicDiscovery: true,
        };

        const embedding = await embeddingService.generateEmbedding(chunkContent);

        await knowledgeRepository.createChunk({
          id: chunkId,
          documentId: docId,
          projectId,
          content: chunkContent,
          metadata: meta,
          embedding,
          chunkIndex: i,
        });
      }

      // Notify knowledge repo listeners to clear caches
      notifyKnowledgeChange(projectId);

      logger.info(`Successfully indexed ${properties.length} dynamic properties for "${normLocality}".`);
      return {
        status: 'INDEXED',
        locality: normLocality,
        propertyCount: properties.length,
        sourceUrl: url,
      };
    } catch (err: any) {
      logger.error(`Error indexing dynamic locality "${normLocality}": ${err.message}`);
      return { status: 'NETWORK_ERROR', locality: normLocality, error: err.message };
    }
  }
}

export const localityDiscoveryService = new LocalityDiscoveryService();
