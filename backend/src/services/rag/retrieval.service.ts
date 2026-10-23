import { embeddingService } from '../embeddings/embedding.service';
import { knowledgeRepository, onKnowledgeChange } from '../../repositories/knowledge.repository';
import { normalizeLocality } from './propertyMatcher.service';
import { logger } from '../../utils/logger';
import { ENV } from '../../config/env';

export interface RetrievalFilter {
  location?: string;
  propertyType?: string; // 2BHK, 3BHK, 4BHK
  projectName?: string;
  budgetMaxLakhs?: number;
  keywords?: string[];
}

export interface RetrievedChunkResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
  sourceTitle: string;
  sourceUrl: string;
}

export class RetrievalService {
  private topK: number;
  private similarityThreshold: number;
  private cache: Map<string, { results: RetrievedChunkResult[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  private propertyChunksCache: Map<string, { chunks: any[]; timestamp: number }> = new Map();
  private readonly PROPERTY_CACHE_TTL_MS = 10 * 60 * 1000;

  constructor() {
    this.topK = ENV.RAG_TOP_K || 12;
    this.similarityThreshold = ENV.RAG_SIMILARITY_THRESHOLD || 0.35;

    // Automatically invalidate cache when documents or chunks are created/updated
    onKnowledgeChange((projectId) => {
      this.invalidateCache(projectId);
    });
  }

  invalidateCache(projectId?: string) {
    if (projectId) {
      this.propertyChunksCache.delete(projectId);
      for (const [key] of this.cache) {
        if (key.startsWith(projectId)) this.cache.delete(key);
      }
    } else {
      this.propertyChunksCache.clear();
      this.cache.clear();
    }
  }

  /**
   * Extract search constraints from user query text and conversation context
   */
  extractQueryFilters(query: string, sessionContext?: any): RetrievalFilter {
    const qLower = query.toLowerCase();
    const filter: RetrievalFilter = {};

    // 0. Use explicit session context location if provided
    if (sessionContext?.discovery?.location) {
      filter.location = normalizeLocality(sessionContext.discovery.location);
    }

    // 1. Location extraction: check explicit pattern ("in <location>", "at <location>")
    if (!filter.location) {
      const locInMatch = qLower.match(/(?:in|around|near|at|to)\s+([a-z\s]{2,25})(?:[,.]|$)/i);
      if (locInMatch && locInMatch[1]) {
        const cand = locInMatch[1].trim();
        const stopWords = ['ahmedabad', 'gujarat', 'india', 'flats', 'properties', 'apartments', 'budget', 'options', 'verified', 'residential'];
        if (!stopWords.includes(cand)) {
          filter.location = normalizeLocality(cand);
        }
      }
    }

    if (!filter.location) {
      // Also check common multi-word and single-word area names
      const commonLocations = [
        'science city', 'south bopal', 'prahlad nagar', 'sg highway', 'gift city',
        'sindhu bhavan road', 'sindhu bhavan', 'gota', 'tragad', 'chandkheda',
        'jagatpur', 'vaishnodevi', 'zundal', 'ognaj', 'satellite', 'shilaj',
        'sola', 'thaltej', 'bodakdev', 'ambli', 'shela', 'bopal', 'vastrapur',
        'navrangpura', 'naranpura', 'memnagar', 'ghatlodia', 'ghatlodiya',
        'motera', 'maninagar', 'ranip', 'paldi'
      ];
      for (const loc of commonLocations) {
        const reg = new RegExp(`\\b${loc.replace(/\s+/g, '\\s+')}\\b`, 'i');
        if (reg.test(qLower)) {
          filter.location = normalizeLocality(loc);
          break;
        }
      }
    }

    if (!filter.location && sessionContext?.discovery?.location) {
      filter.location = normalizeLocality(sessionContext.discovery.location) || sessionContext.discovery.location;
    }

    // 2. Property Type / BHK extraction
    if (/5\s*bhk/i.test(qLower) || /5\s*bed/i.test(qLower)) filter.propertyType = '5BHK';
    else if (/4\s*bhk/i.test(qLower) || /4\s*bed/i.test(qLower)) filter.propertyType = '4BHK';
    else if (/3\s*bhk/i.test(qLower) || /3\s*bed/i.test(qLower)) filter.propertyType = '3BHK';
    else if (/2\s*bhk/i.test(qLower) || /2\s*bed/i.test(qLower)) filter.propertyType = '2BHK';
    else if (sessionContext?.discovery?.homeType) {
      const ht = sessionContext.discovery.homeType.toUpperCase();
      if (ht.includes('3')) filter.propertyType = '3BHK';
      else if (ht.includes('2')) filter.propertyType = '2BHK';
      else if (ht.includes('4') || ht.includes('5')) filter.propertyType = '4BHK';
    }

    // 3. Project Name extraction
    const knownProjects = [
      'aahvan greens', 'aahvan', 'samatva amaryllis', 'samatva', 'ananta', 'satyamev serene',
      'satyamev', 'shyam heights', 'nilyam', 'siddharth gardenia', 'aryamaan glory',
      'shreehari skyleaf', 'shikhar landmark', 'vashikaa prime', 'shree kalash',
      'satyaa heights', 'shubh green', 'shivanta rigel', 'siddharth luxuria',
      'the sovereign', 'gift horizon', 'emerald heights', 'capital square',
      'kautilya', 'nivasa', 'sahajanand', 'vivaan', 'belrosa', 'amora', 'sculpture',
      'festival vibes', 'trinay anagh', 'aurania', 'callisto', 'amara', 'evara',
      'corus ample', 'pratham heights', 'anantara alpines', 'sky 100', 'amaris', 'shalok amaltas'
    ];

    for (const proj of knownProjects) {
      if (qLower.includes(proj)) {
        filter.projectName = proj;
        break;
      }
    }

    // 4. Budget extraction
    const crMatch = qLower.match(/(?:around|under|below|within|upto|up to|about)?\s*([0-9.]+)\s*(?:cr|crore)/i);
    if (crMatch) {
      const val = parseFloat(crMatch[1]);
      if (!isNaN(val)) filter.budgetMaxLakhs = val * 100;
    } else {
      const lakhMatch = qLower.match(/(?:around|under|below|within|upto|up to|about)?\s*([0-9.]+)\s*(?:lakh|lac)/i);
      if (lakhMatch) {
        const val = parseFloat(lakhMatch[1]);
        if (!isNaN(val)) filter.budgetMaxLakhs = val;
      }
    }

    if (!filter.budgetMaxLakhs && sessionContext?.discovery?.budgetNum) {
      filter.budgetMaxLakhs = sessionContext.discovery.budgetNum;
    }

    return filter;
  }

  /**
   * Hybrid retrieval combining vector similarity, keyword matching, and metadata filtering
   */
  async hybridRetrieve(
    projectId: string,
    query: string,
    sessionContext?: any,
    topKOverride?: number
  ): Promise<RetrievedChunkResult[]> {
    const k = topKOverride || this.topK;
    const filters = this.extractQueryFilters(query, sessionContext);
    const targetLoc = normalizeLocality(filters.location);

    // Check retrieval cache to avoid repeating identical searches
    const cacheKey = `${projectId}:${query.trim().toLowerCase()}:${targetLoc || ''}:${filters.propertyType || ''}:${filters.budgetMaxLakhs || ''}:${filters.projectName || ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.results;
    }

    // 1. Generate query embedding with fast timeout (capped at 750ms)
    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await Promise.race([
        embeddingService.generateEmbedding(query),
        new Promise<number[]>((_, reject) =>
          setTimeout(() => reject(new Error('Embedding generation timeout')), 750)
        ),
      ]);
    } catch (err: any) {
      logger.warn(`Fast query embedding timeout (${err.message}). Using fallback semantic matching.`);
    }

    // 2. Fetch candidates from vector retrieval
    let candidates: any[] = [];
    if (queryEmbedding && queryEmbedding.length > 0) {
      try {
        candidates = await knowledgeRepository.findSimilarChunks(
          projectId,
          queryEmbedding,
          k * 2,
          this.similarityThreshold
        );
      } catch (err: any) {
        logger.warn(`Vector search error: ${err.message}`);
      }
    }

    // Augment candidates with verified property chunks (cached in memory for sub-millisecond retrieval)
    try {
      let propertyChunks: any[] = [];
      const propCached = this.propertyChunksCache.get(projectId);
      if (propCached && Date.now() - propCached.timestamp < this.PROPERTY_CACHE_TTL_MS) {
        propertyChunks = propCached.chunks;
      } else {
        const allChunks = await knowledgeRepository.getAllChunks(projectId);
        propertyChunks = allChunks.filter((chunk) => {
          const rawMeta = chunk.metadata;
          const meta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : (rawMeta || {});
          return Boolean(meta.projectName || (chunk.content && /Project:\s*\S+/i.test(chunk.content)));
        });
        this.propertyChunksCache.set(projectId, { chunks: propertyChunks, timestamp: Date.now() });
      }

      // If a specific locality was requested, prioritize and isolate chunks from that locality!
      const relevantPropertyChunks = targetLoc && targetLoc !== 'Ahmedabad'
        ? propertyChunks.filter((chunk) => {
            const rawMeta = chunk.metadata;
            const meta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : (rawMeta || {});
            const chunkLoc = normalizeLocality(meta.location) || meta.location;
            if (chunkLoc && chunkLoc.toLowerCase() === targetLoc.toLowerCase()) return true;
            const reg = new RegExp(`\\b${targetLoc.replace(/\s+/g, '\\s+')}\\b`, 'i');
            return reg.test(chunk.content || '');
          })
        : propertyChunks;

      const existingIds = new Set(candidates.map((c) => c.id));
      for (const chunk of relevantPropertyChunks) {
        if (!existingIds.has(chunk.id)) {
          const rawMeta = chunk.metadata;
          const meta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : (rawMeta || {});
          candidates.push({
            ...chunk,
            metadata: meta,
            similarity: 0.65,
          });
          existingIds.add(chunk.id);
        }
      }
    } catch (err: any) {
      logger.warn(`Error augmenting property chunks: ${err.message}`);
    }

    // If still no candidates, fallback to all chunks
    if (candidates.length === 0) {
      candidates = await knowledgeRepository.getAllChunks(projectId);
    }

    // 3. Score & rerank with Hybrid Filtering
    const scoredList: RetrievedChunkResult[] = [];
    const qLower = query.toLowerCase();
    const queryTokens = qLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);

    for (const c of candidates) {
      let score = c.similarity || 0.4;
      const contentLower = (c.content || '').toLowerCase();
      const rawMeta = c.metadata;
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

      const hasProject = Boolean(meta.projectName || /Project:\s*\S+/i.test(contentLower));

      // Property chunk boost: prioritize actual property listings over general web text
      if (hasProject) {
        score += 0.35;
      }

      // Match Project Name
      if (filters.projectName && (contentLower.includes(filters.projectName) || (meta.projectName || '').toLowerCase().includes(filters.projectName))) {
        score += 0.45;
      }

      // Match Location
      if (targetLoc && targetLoc !== 'Ahmedabad') {
        const chunkLoc = normalizeLocality(meta.location) || meta.location;
        const targetLower = targetLoc.toLowerCase();
        const matchesTargetLoc =
          (chunkLoc && chunkLoc.toLowerCase() === targetLower) ||
          new RegExp(`\\b${targetLoc.replace(/\s+/g, '\\s+')}\\b`, 'i').test(contentLower);

        if (matchesTargetLoc) {
          score += 0.80; // High boost for matching requested locality
        } else if (
          chunkLoc &&
          chunkLoc.toLowerCase() !== targetLower &&
          chunkLoc.toLowerCase() !== 'ahmedabad'
        ) {
          score -= 2.0; // Heavy penalty for chunks that belong to a DIFFERENT locality
        }
      } else if (filters.location) {
        const locLower = filters.location.toLowerCase();
        if (contentLower.includes(locLower) || (meta.location || '').toLowerCase().includes(locLower) || (meta.city || '').toLowerCase().includes(locLower)) {
          score += 0.30;
        }
      }

      // Match BHK / Property Type
      if (filters.propertyType) {
        const typeLower = filters.propertyType.toLowerCase();
        if (contentLower.includes(typeLower) || (meta.propertyType || '').toLowerCase().includes(typeLower) || (meta.bhk || '').toLowerCase().includes(typeLower)) {
          score += 0.25;
        }
      }

      // Match Budget constraint
      if (filters.budgetMaxLakhs && meta.priceNum) {
        if (meta.priceNum <= filters.budgetMaxLakhs * 1.05) {
          score += 0.20;
        } else {
          score -= 0.35; // penalize if over budget
        }
      }

      // Keyword overlap boost
      let matchedTokens = 0;
      for (const token of queryTokens) {
        if (contentLower.includes(token)) matchedTokens++;
      }
      if (queryTokens.length > 0) {
        score += (matchedTokens / queryTokens.length) * 0.20;
      }

      scoredList.push({
        id: c.id,
        content: c.content,
        metadata: meta,
        score,
        sourceTitle: c.sourceTitle || meta.projectName || 'Prycoons Real Estate Records',
        sourceUrl: c.sourceUrl || meta.sourceUrl || 'https://prycoons.com/',
      });
    }

    // Sort by final hybrid score descending
    scoredList.sort((a, b) => b.score - a.score);
    const topResults = scoredList.slice(0, k);

    // Save in cache
    this.cache.set(cacheKey, {
      results: topResults,
      timestamp: Date.now(),
    });

    logger.info(`Hybrid retrieval for "${query}" (Loc: ${targetLoc || 'Any'}): Found ${topResults.length} relevant chunks (top score: ${topResults[0]?.score.toFixed(2) || '0.00'})`);
    return topResults;
  }

  /**
   * Format retrieved chunks into a clean grounded context block for LLM prompt
   */
  formatContextForPrompt(chunks: RetrievedChunkResult[], maxChunks = 3): string {
    if (!chunks || chunks.length === 0) {
      return 'No specific property records were retrieved for this query.';
    }

    // Filter out chunks that were heavily penalized (score <= 0) to ensure LLM context is geographically clean
    const validChunks = chunks.filter((c) => c.score > 0);
    const chosen = validChunks.length > 0 ? validChunks.slice(0, maxChunks) : chunks.slice(0, maxChunks);

    return chosen
      .map((c, i) => `[Source ${i + 1}: ${c.sourceTitle} | ${c.sourceUrl}]\n${c.content}`)
      .join('\n\n---\n\n');
  }
}

export const retrievalService = new RetrievalService();
