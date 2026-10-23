import { PropertyCardData } from '../../types';
import { RetrievedChunkResult } from './retrieval.service';
import { CANONICAL_PROPERTY_URLS } from './canonicalUrls';

export { CANONICAL_PROPERTY_URLS };

export interface PropertyMatchResult {
  exactMatch: PropertyCardData | null;
  alternatives: PropertyCardData[];
  allMatches: PropertyCardData[];
  explanation: string;
}

export const SUPPORTED_LOCALITIES = [
  'Tragad',
  'Chandkheda',
  'Gota',
  'Zundal',
  'Vaishnodevi',
  'Ognaj',
  'Satellite',
  'Science City',
  'Shilaj',
  'Sola',
  'Thaltej',
  'Jagatpur',
] as const;

export function normalizeLocality(loc?: string): string | undefined {
  if (!loc) return undefined;
  let clean = loc.trim();
  // Strip trailing "ahmedabad", "gujarat", punctuation
  clean = clean.replace(/,\s*(?:ahmedabad|gujarat|india)\b/i, '').trim();
  const l = clean.toLowerCase();

  // Specific known spacing/capitalization preferences
  if (/\bscience\s*city\b/i.test(l)) return 'Science City';
  if (/\bvaishnodevi\b|\bvaishno\s*devi\b/i.test(l)) return 'Vaishnodevi';
  if (/\bprahlad\s*nagar\b|\bprahladnagar\b/i.test(l)) return 'Prahlad Nagar';
  if (/\bsouth\s*bopal\b/i.test(l)) return 'South Bopal';
  if (/\bgift\s*city\b/i.test(l)) return 'GIFT City';
  if (/\bsindhu\s*bhavan(?:\s*road)?\b/i.test(l)) return 'Sindhu Bhavan Road';

  // For any other multi-word or single-word locality: Title Case each word
  return clean
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}


/**
 * Resolve verified property images from indexed metadata.
 * Never use stock photos or fabricated Unsplash URLs.
 */
function resolvePropertyImage(customImage?: string): string | undefined {
  if (customImage && customImage.startsWith('http') && !customImage.includes('transparent.gif')) {
    return customImage;
  }
  return undefined;
}

export class PropertyMatcherService {
  /**
   * Match structured property cards from retrieved chunks based on user preferences
   * Enforces hard locality, BHK, and budget filtering before ranking.
   */
  matchProperties(
    retrievedChunks: RetrievedChunkResult[],
    preferences: {
      location?: string;
      propertyType?: string;
      budgetNum?: number;
      mustHave?: string;
      projectName?: string;
    }
  ): PropertyMatchResult {
    const propertyCards: PropertyCardData[] = [];

    // 1. Extract property cards from chunks
    for (const chunk of retrievedChunks) {
      const rawMeta = chunk.metadata;
      let meta: Record<string, any> = {};
      if (typeof rawMeta === 'string') {
        try {
          meta = JSON.parse(rawMeta);
        } catch {
          meta = {};
        }
      } else if (rawMeta && typeof rawMeta === 'object') {
        meta = rawMeta;
      }

      // Resolve project name
      let projectName = meta.projectName || meta.title;
      if (!projectName && chunk.content) {
        const pMatch = chunk.content.match(/Project:\s*([^\n\r]+)/i);
        if (pMatch) projectName = pMatch[1].trim();
      }

      if (projectName) {
        // Location extraction & normalization
        let location = meta.location;
        if (!location && chunk.content) {
          const locMatch = chunk.content.match(/Location:\s*([^\n\r,]+)/i);
          if (locMatch) location = locMatch[1].trim();
        }
        const normLoc = normalizeLocality(location) || location;

        let bhk = meta.bhk || meta.propertyType;
        if (!bhk && chunk.content) {
          const bhkMatch = chunk.content.match(/Configuration:\s*([^\n\r]+)/i);
          if (bhkMatch) bhk = bhkMatch[1].trim();
        }

        let price = meta.price;
        if (!price && chunk.content) {
          const priceMatch = chunk.content.match(/Price:\s*([^\n\r]+)/i);
          if (priceMatch) price = priceMatch[1].trim();
        }

        let priceNum = meta.priceNum;
        if (priceNum === undefined && price) {
          const cr = price.match(/([0-9.]+)\s*(?:cr|crore)/i);
          const lakh = price.match(/([0-9.]+)\s*(?:lakh|lac)/i);
          if (cr) priceNum = parseFloat(cr[1]) * 100;
          else if (lakh) priceNum = parseFloat(lakh[1]);
        }

        let carpetArea = meta.carpetArea;
        if (!carpetArea && chunk.content) {
          const areaMatch = chunk.content.match(/Area:\s*([^\n\r]+)/i);
          if (areaMatch) carpetArea = areaMatch[1].trim();
        }

        let amenities: string[] = Array.isArray(meta.amenities) ? meta.amenities : [];
        if (amenities.length === 0 && chunk.content) {
          const amMatch = chunk.content.match(/Amenities:\s*([^\n\r]+)/i);
          if (amMatch) {
            amenities = amMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
          }
        }

        let image = resolvePropertyImage(meta.image);
        if (!image && chunk.content) {
          const imgMatch = chunk.content.match(/(?:Image|Photo):\s*(https?:\/\/[^\s\n\r]+)/i);
          if (imgMatch) image = resolvePropertyImage(imgMatch[1].trim());
        }

        // Resolve exact canonical property-detail URL
        let detailUrl = meta.propertyDetailUrl || meta.sourceUrl || chunk.sourceUrl;
        const normName = projectName.toLowerCase().trim();
        if (CANONICAL_PROPERTY_URLS[normName]) {
          detailUrl = CANONICAL_PROPERTY_URLS[normName];
        } else {
          for (const [key, url] of Object.entries(CANONICAL_PROPERTY_URLS)) {
            if (normName === key || normName.includes(key) || key.includes(normName)) {
              detailUrl = url;
              break;
            }
          }
        }

        // Never redirect to the bare homepage or status filter page
        if (
          !detailUrl ||
          detailUrl === 'https://prycoons.com/' ||
          detailUrl === 'https://prycoons.com' ||
          detailUrl.includes('/status/')
        ) {
          detailUrl = undefined;
        }

        const card: PropertyCardData = {
          id: `card-${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          title: projectName,
          propertyName: projectName,
          tagline: `${bhk || 'Residential Property'} in ${normLoc || 'Ahmedabad'}`,
          location: `${normLoc || 'Ahmedabad'}, Gujarat`,
          bhk: bhk || '3 BHK',
          carpetArea: carpetArea || undefined,
          priceRange: price || 'Price on request',
          priceNum: priceNum || undefined,
          status: meta.propertyStatus || 'Under Construction (RERA Approved)',
          image,
          propertyImageUrl: image,
          amenities,
          sourceUrl: detailUrl,
          propertyDetailUrl: detailUrl,
          description: chunk.content,
        };

        // Deduplicate cards by title
        if (!propertyCards.some((c) => c.title.toLowerCase() === card.title.toLowerCase())) {
          propertyCards.push(card);
        }
      }
    }

    if (propertyCards.length === 0) {
      return {
        exactMatch: null,
        alternatives: [],
        allMatches: [],
        explanation: 'No verified properties matched the exact criteria.',
      };
    }

    // 2. HARD LOCALITY FILTERING
    // A query for Gota must only return Gota properties.
    // A query for Chandkheda must only return Chandkheda properties.
    // Never allow non-matching localities to leak into results!
    let candidateCards = propertyCards;
    const targetLoc = normalizeLocality(preferences.location);

    if (targetLoc && targetLoc.toLowerCase() !== 'ahmedabad') {
      const targetLower = targetLoc.toLowerCase();
      candidateCards = candidateCards.filter((card) => {
        // Match 1: Normalized locality of card
        const cardLoc = normalizeLocality(card.location);
        if (cardLoc && cardLoc.toLowerCase() === targetLower) {
          return true;
        }

        // Match 2: Exact word-boundary match in card location, title, or description
        const regex = new RegExp(`\\b${targetLoc.replace(/\s+/g, '\\s+')}\\b`, 'i');
        if (regex.test(card.location) || regex.test(card.title) || regex.test(card.description || '')) {
          // Guard against false positive if card is explicitly tagged with a DIFFERENT locality
          if (
            cardLoc &&
            cardLoc.toLowerCase() !== targetLower &&
            cardLoc.toLowerCase() !== 'ahmedabad'
          ) {
            return false;
          }
          return true;
        }

        return false;
      });
    }

    // 3. HARD BHK FILTERING
    if (preferences.propertyType) {
      const pType = preferences.propertyType.toUpperCase();
      const bhkMatch = pType.match(/([1-5])\s*BHK/i) || pType.match(/([1-5])/);
      if (bhkMatch) {
        const reqBed = bhkMatch[1];
        candidateCards = candidateCards.filter((card) => {
          const cardBhk = (card.bhk || '').toUpperCase();
          return new RegExp(`\\b${reqBed}\\b`).test(cardBhk) || cardBhk.includes(`${reqBed}BHK`);
        });
      }
    }

    // 4. HARD BUDGET FILTERING
    if (preferences.budgetNum) {
      const maxBudget = preferences.budgetNum;
      candidateCards = candidateCards.filter((card) => {
        if (!card.priceNum) return false; // Exclude unknown prices on strict budget searches
        return card.priceNum <= maxBudget; // Strict budget enforcement: must be at or below requested maximum
      });
    }

    // If no properties survive the hard filters, return empty results honestly!
    if (candidateCards.length === 0) {
      return {
        exactMatch: null,
        alternatives: [],
        allMatches: [],
        explanation: targetLoc
          ? `No verified properties in ${targetLoc} matched the specified criteria.`
          : 'No verified properties matched the specified criteria.',
      };
    }

    // 5. Rank surviving cards based on relevance
    const rankedCards = candidateCards
      .map((card) => {
        let matchScore = 0;

        // Specific project name match (highest priority if user inquires about a specific project)
        if (preferences.projectName) {
          const pLower = preferences.projectName.toLowerCase();
          if (card.title.toLowerCase().includes(pLower) || pLower.includes(card.title.toLowerCase())) {
            matchScore += 50;
          }
        }

        // Budget alignment: bonus if within budget
        if (preferences.budgetNum && card.priceNum) {
          if (card.priceNum <= preferences.budgetNum) {
            matchScore += 10;
          }
        }

        // Real image present
        if (card.image) {
          matchScore += 5;
        }

        return { card, matchScore };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((item) => item.card);

    const exactMatch = rankedCards[0] || null;
    const alternatives = rankedCards.slice(1);

    return {
      exactMatch,
      alternatives,
      allMatches: rankedCards,
      explanation: exactMatch
        ? `Found ${exactMatch.title} in ${targetLoc || 'Ahmedabad'} matching your criteria.`
        : 'Found verified properties matching your criteria.',
    };
  }
}

export const propertyMatcherService = new PropertyMatcherService();
