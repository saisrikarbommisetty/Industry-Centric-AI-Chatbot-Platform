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
  projectId?: string;
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

  private queryEmbeddingCache: Map<string, { embedding: number[]; timestamp: number }> = new Map();
  private readonly EMBEDDING_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour embedding cache

  private allChunksCache: Map<string, { chunks: any[]; timestamp: number }> = new Map();
  private readonly CHUNKS_CACHE_TTL_MS = 5 * 60 * 1000;

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
      this.allChunksCache.delete(projectId);
      for (const [key] of this.cache) {
        if (key.startsWith(projectId)) this.cache.delete(key);
      }
    } else {
      this.propertyChunksCache.clear();
      this.allChunksCache.clear();
      this.cache.clear();
      this.queryEmbeddingCache.clear();
    }
  }

  /**
   * Fast, cached query embedding with safe timeout
   */
  async getQueryEmbeddingWithCache(query: string): Promise<number[]> {
    const qNorm = query.trim().toLowerCase();
    const cached = this.queryEmbeddingCache.get(qNorm);
    if (cached && Date.now() - cached.timestamp < this.EMBEDDING_CACHE_TTL_MS) {
      return cached.embedding;
    }

    try {
      const embedding = await Promise.race([
        embeddingService.generateEmbedding(query),
        new Promise<number[]>((_, reject) =>
          setTimeout(() => reject(new Error('Embedding generation timeout')), 2500)
        ),
      ]);
      if (embedding && embedding.length > 0) {
        this.queryEmbeddingCache.set(qNorm, { embedding, timestamp: Date.now() });
        return embedding;
      }
    } catch (err: any) {
      logger.warn(`Query embedding notice for "${query.slice(0, 40)}": ${err.message}. Using resilient hybrid semantic search.`);
    }
    return [];
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
    topKOverride?: number,
    botConfig?: { industry?: string; botName?: string; websiteUrl?: string }
  ): Promise<RetrievedChunkResult[]> {
    const k = topKOverride || this.topK;
    const isPrycoons = projectId === 'prycoons-ai' || projectId.includes('prycoons') || Boolean(botConfig?.botName?.toLowerCase().includes('prycoons'));
    const isRealEstate = (botConfig?.industry === 'real-estate' || isPrycoons) && botConfig?.industry !== 'healthcare' && botConfig?.industry !== 'education';
    const filters = this.extractQueryFilters(query, sessionContext);
    const targetLoc = isRealEstate ? normalizeLocality(filters.location) : undefined;

    // Check retrieval cache to avoid repeating identical searches
    const cacheKey = `${projectId}:${query.trim().toLowerCase()}:${targetLoc || ''}:${filters.propertyType || ''}:${filters.budgetMaxLakhs || ''}:${filters.projectName || ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.results;
    }

    // 1. Generate query embedding with fast cache and resilient timeout
    const queryEmbedding = await this.getQueryEmbeddingWithCache(query);

    // 2. Fetch candidates from vector retrieval scoped strictly to projectId
    let candidates: any[] = [];
    if (queryEmbedding && queryEmbedding.length > 0) {
      try {
        candidates = await knowledgeRepository.findSimilarChunks(
          projectId,
          queryEmbedding,
          k * 3,
          this.similarityThreshold
        );
      } catch (err: any) {
        logger.warn(`Vector search error for project ${projectId}: ${err.message}`);
      }
    }

    // 3. Fetch project chunks from cache or DB to combine with lexical & property search
    let allProjectChunks: any[] = [];
    try {
      const cachedChunks = this.allChunksCache.get(projectId);
      if (cachedChunks && Date.now() - cachedChunks.timestamp < this.CHUNKS_CACHE_TTL_MS) {
        allProjectChunks = cachedChunks.chunks;
      } else {
        allProjectChunks = await knowledgeRepository.getAllChunks(projectId);
        this.allChunksCache.set(projectId, { chunks: allProjectChunks, timestamp: Date.now() });
      }
    } catch (err: any) {
      logger.warn(`Error fetching all chunks for project ${projectId}: ${err.message}`);
    }

    // Augment candidates with verified property chunks only for real estate bots
    if (isRealEstate) {
      try {
        const propertyChunks = allProjectChunks.filter((chunk) => {
          const rawMeta = chunk.metadata;
          const meta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : (rawMeta || {});
          return Boolean(meta.projectName || (chunk.content && /Project:\s*\S+/i.test(chunk.content)));
        });

        // If a specific locality was requested, prioritize and isolate chunks from that locality
        const relevantPropertyChunks = targetLoc && targetLoc !== 'Ahmedabad'
          ? propertyChunks.filter((chunk) => {
              const rawMeta = chunk.metadata;
              const meta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : (rawMeta || {});
              const chunkLoc = normalizeLocality(meta.location) || meta.location;
              if (chunkLoc && chunkLoc.toLowerCase() === targetLoc.toLowerCase()) return true;
              if (chunkLoc && new RegExp(`\\b${chunkLoc.toLowerCase().replace(/\\s+/g, '\\s+')}\\b`, 'i').test(query.toLowerCase())) return true;
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
    }

    // Ensure candidate pool includes project chunks for comprehensive lexical scoring
    const existingCandidateIds = new Set(candidates.map((c) => c.id));
    for (const chunk of allProjectChunks) {
      if (!existingCandidateIds.has(chunk.id)) {
        candidates.push({
          ...chunk,
          similarity: 0.25,
        });
        existingCandidateIds.add(chunk.id);
      }
    }

    // 4. Score & rerank with Hybrid Filtering
    const scoredList: RetrievedChunkResult[] = [];
    const qLower = query.toLowerCase();

    const stopWords = new Set([
      'what', 'is', 'the', 'a', 'an', 'are', 'was', 'were', 'you', 'your', 'our', 'we', 'i', 'me', 'my',
      'it', 'its', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'do', 'does', 'did', 'can', 'could',
      'how', 'why', 'when', 'where', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'there',
      'have', 'has', 'had', 'tell', 'show', 'give', 'about', 'any', 'some', 'please', 'know', 'much', 'like'
    ]);

    const rawTokens = qLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
    const significantTokens = rawTokens.filter((w) => !stopWords.has(w) && w.length > 2);
    const searchTokens = significantTokens.length > 0 ? significantTokens : rawTokens;

    for (const c of candidates) {
      let score = c.similarity || 0.35;
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

      if (isRealEstate) {
        const hasProject = Boolean(meta.projectName || /Project:\s*\S+/i.test(contentLower));
        if (hasProject) score += 0.35;

        // Match Project Name
        if (filters.projectName && (contentLower.includes(filters.projectName) || (meta.projectName || '').toLowerCase().includes(filters.projectName))) {
          score += 0.55;
        }

        // Match Location
        if (targetLoc && targetLoc !== 'Ahmedabad') {
          const chunkLoc = normalizeLocality(meta.location) || meta.location;
          const targetLower = targetLoc.toLowerCase();
          const matchesTargetLoc =
            (chunkLoc && chunkLoc.toLowerCase() === targetLower) ||
            new RegExp(`\\b${targetLoc.replace(/\s+/g, '\\s+')}\\b`, 'i').test(contentLower);

          if (matchesTargetLoc) {
            score += 0.80;
          } else if (chunkLoc && chunkLoc.toLowerCase() !== targetLower && chunkLoc.toLowerCase() !== 'ahmedabad') {
            const isChunkLocInQuery = new RegExp(`\\b${chunkLoc.toLowerCase().replace(/\\s+/g, '\\s+')}\\b`, 'i').test(qLower);
            if (isChunkLocInQuery) {
              score += 0.80;
            } else {
              score -= 2.0;
            }
          }
        } else if (filters.location) {
          const locLower = filters.location.toLowerCase();
          if (contentLower.includes(locLower) || (meta.location || '').toLowerCase().includes(locLower) || (meta.city || '').toLowerCase().includes(locLower)) {
            score += 0.35;
          }
        }

        // Match BHK / Property Type
        if (filters.propertyType) {
          const typeLower = filters.propertyType.toLowerCase();
          if (contentLower.includes(typeLower) || (meta.propertyType || '').toLowerCase().includes(typeLower) || (meta.bhk || '').toLowerCase().includes(typeLower)) {
            score += 0.30;
          }
        }

        // Match Budget constraint
        if (filters.budgetMaxLakhs && meta.priceNum) {
          if (meta.priceNum <= filters.budgetMaxLakhs * 1.05) {
            score += 0.20;
          } else {
            score -= 0.35;
          }
        }

        // Token matches
        let matched = 0;
        for (const t of searchTokens) {
          if (contentLower.includes(t)) matched++;
        }
        if (searchTokens.length > 0) {
          score += (matched / searchTokens.length) * 0.40;
        }

        const defaultTitle = isPrycoons ? 'Prycoons Real Estate Records' : `${botConfig?.botName || 'Business'} Knowledge Base`;
        const defaultUrl = isPrycoons ? 'https://prycoons.com/' : (botConfig?.websiteUrl || '');

        scoredList.push({
          id: c.id,
          projectId: c.projectId || projectId,
          content: c.content,
          metadata: meta,
          score,
          sourceTitle: c.sourceTitle || meta.projectName || defaultTitle,
          sourceUrl: c.sourceUrl || meta.sourceUrl || defaultUrl,
        });
      } else {
        // Multi-Industry / General Bot scoring
        // Expand search tokens with multi-industry inquiry synonyms and morphological stems
        const expandedTokens = new Set<string>();
        for (const t of searchTokens) {
          expandedTokens.add(t);
          // Add morphological stems
          if (t.endsWith('ies') && t.length > 4) expandedTokens.add(t.slice(0, -3) + 'y');
          else if (t.endsWith('es') && t.length > 4) expandedTokens.add(t.slice(0, -2));
          else if (t.endsWith('s') && !t.endsWith('ss') && t.length > 3) expandedTokens.add(t.slice(0, -1));
          if (t.endsWith('ing') && t.length > 5) expandedTokens.add(t.slice(0, -3));
          if (t.endsWith('ed') && t.length > 4) expandedTokens.add(t.slice(0, -2));
          if (t.endsWith('tion') && t.length > 6) expandedTokens.add(t.slice(0, -4));
          if (t.endsWith('ment') && t.length > 6) expandedTokens.add(t.slice(0, -4));
          if (t.endsWith('ity') && t.length > 5) expandedTokens.add(t.slice(0, -3));
        }

        // Pricing, Fees, Tuition, and Scholarships synonyms
        if (searchTokens.some((t) => ['price', 'pricing', 'cost', 'fee', 'fees', 'charge', 'rate', 'tuition', 'budget', 'scholarship', 'grant', 'aid', 'discount', 'installment', 'emi', 'pay', 'payment'].some((w) => t.includes(w) || w.includes(t)))) {
          ['price', 'cost', 'fee', 'fees', 'charges', 'rate', 'tuition', 'scholarship', 'scholarships', 'grant', 'grants', 'financial aid', 'discount', 'installment', 'emi', 'payment', '₹', '$', 'usd', 'inr', 'annual'].forEach((w) => expandedTokens.add(w));
        }

        // Timing, Schedule, Duration, and Batch hours
        if (searchTokens.some((t) => ['time', 'timing', 'hours', 'hour', 'schedule', 'open', 'close', 'when', 'days', 'weeks', 'months', 'weekend', 'batch', 'duration'].some((w) => t.includes(w) || w.includes(t)))) {
          ['hours', 'timing', 'timings', 'time', 'schedule', 'batch', 'batches', 'duration', 'open', 'closed', 'am', 'pm', 'monday', 'sunday', 'daily', 'weekend', 'morning', 'evening', 'weeks', 'months'].forEach((w) => expandedTokens.add(w));
        }

        // Admissions, Eligibility, Requirements, and Application
        if (searchTokens.some((t) => ['admission', 'admissions', 'apply', 'application', 'eligible', 'eligibility', 'qualify', 'qualification', 'requirement', 'requirements', 'prerequisite', 'prerequisites', 'criteria', 'enroll', 'enrollment', 'register', 'registration'].some((w) => t.includes(w) || w.includes(t)))) {
          ['admission', 'admissions', 'apply', 'application', 'applicant', 'eligible', 'eligibility', 'qualify', 'qualification', 'qualifications', 'prerequisite', 'prerequisites', 'requirement', 'requirements', 'criteria', 'intake', 'enroll', 'enrollment', 'register', 'registration', 'who can'].forEach((w) => expandedTokens.add(w));
        }

        // Refund, Cancellation, and Policy
        if (searchTokens.some((t) => ['refund', 'cancel', 'cancellation', 'withdraw', 'withdrawal', 'policy', 'policies', 'guarantee', 'money'].some((w) => t.includes(w) || w.includes(t)))) {
          ['refund', 'refunds', 'cancellation', 'cancel', 'withdrawal', 'withdraw', 'policy', 'policies', 'guarantee', 'money back', 'terms'].forEach((w) => expandedTokens.add(w));
        }

        // Career, Placement, and Jobs
        if (searchTokens.some((t) => ['placement', 'career', 'job', 'internship', 'hiring', 'salary', 'package', 'work'].some((w) => t.includes(w) || w.includes(t)))) {
          ['placement', 'placements', 'career', 'careers', 'job', 'jobs', 'internship', 'internships', 'hiring', 'salary', 'hired', 'alumni', 'employment'].forEach((w) => expandedTokens.add(w));
        }

        // Certifications, Accreditation, and Degree
        if (searchTokens.some((t) => ['certificate', 'certification', 'diploma', 'degree', 'accredit', 'accreditation'].some((w) => t.includes(w) || w.includes(t)))) {
          ['certificate', 'certification', 'certifications', 'diploma', 'degree', 'accredited', 'accreditation', 'credential', 'recognized'].forEach((w) => expandedTokens.add(w));
        }

        // Healthcare, Doctor, and Treatments
        if (searchTokens.some((t) => ['doctor', 'treatment', 'surgery', 'clinic', 'hospital', 'health', 'patient', 'appointment', 'consult'].some((w) => t.includes(w) || w.includes(t)))) {
          ['treatment', 'treatments', 'doctor', 'doctors', 'physician', 'specialist', 'department', 'care', 'surgery', 'clinic', 'appointment', 'consultation', 'therapy'].forEach((w) => expandedTokens.add(w));
        }

        // Contact, Office, Location, and Support
        if (searchTokens.some((t) => ['contact', 'reach', 'phone', 'call', 'email', 'number', 'address', 'where', 'location', 'office', 'support'].some((w) => t.includes(w) || w.includes(t)))) {
          ['contact', 'phone', 'email', 'call', 'reach', 'website', 'address', 'located', 'office', 'headquarters', 'directions'].forEach((w) => expandedTokens.add(w));
        }

        let matchedCount = 0;
        for (const token of expandedTokens) {
          if (contentLower.includes(token)) matchedCount++;
        }

        // Significant token match score
        const tokenMatchRatio = searchTokens.length > 0 ? matchedCount / Math.max(1, searchTokens.length) : 0;
        score += Math.min(1.8, tokenMatchRatio * 0.95);

        // Exact query substring or multi-word phrase match boost
        if (contentLower.includes(qLower)) {
          score += 0.85;
        } else {
          // Check 2-word phrase matches
          const words = rawTokens;
          for (let i = 0; i < words.length - 1; i++) {
            const bigram = `${words[i]} ${words[i + 1]}`;
            if (bigram.length > 6 && contentLower.includes(bigram)) {
              score += 0.35;
              break;
            }
          }
        }

        // Multi-term co-occurrence boost (entity + attribute)
        const matchedSignificant = searchTokens.filter((t) => contentLower.includes(t));
        if (matchedSignificant.length >= 2) {
          score += 0.40 * matchedSignificant.length;
        }

        // Numerical constraint matching (e.g. "under $5000", "below 20 weeks", numbers mentioned)
        const queryNumbers = qLower.match(/\b\d{2,}\b/g);
        if (queryNumbers) {
          for (const num of queryNumbers) {
            if (contentLower.includes(num)) {
              score += 0.50;
            }
          }
        }

        // Table and structured specification presence boost
        if (meta.hasTable || contentLower.includes('[table content]')) {
          const isTableRelevant = searchTokens.some((t) => ['fee', 'fees', 'price', 'pricing', 'cost', 'duration', 'schedule', 'hours', 'specs', 'specification', 'plan', 'plans'].includes(t));
          if (isTableRelevant) {
            score += 0.60;
          }
        }

        // Visual / Image inquiry boost
        if (meta.hasVisual || contentLower.includes('[visual asset:')) {
          if (searchTokens.some((t) => ['image', 'photo', 'picture', 'diagram', 'visual', 'chart', 'logo', 'look'].includes(t))) {
            score += 0.80;
          }
        }

        // Document title or Section header match boost
        const docTitle = (c.sourceTitle || meta.title || meta.section || '').toLowerCase();
        if (docTitle && Array.from(expandedTokens).some((t) => docTitle.includes(t))) {
          score += 0.55;
        }

        // Keep chunks that have vector similarity OR any matching keyword
        const hasKeywordMatch = matchedCount > 0 || contentLower.includes(qLower) || Boolean(docTitle && Array.from(expandedTokens).some((t) => docTitle.includes(t)));
        const hasVectorMatch = Boolean(c.similarity && c.similarity >= 0.38);

        if (!hasKeywordMatch && !hasVectorMatch) {
          continue;
        }

        scoredList.push({
          id: c.id,
          projectId: c.projectId || projectId,
          content: c.content,
          metadata: meta,
          score,
          sourceTitle: c.sourceTitle || meta.title || (botConfig?.botName ? `${botConfig.botName} Knowledge` : 'Knowledge Base'),
          sourceUrl: c.sourceUrl || meta.sourceUrl || '',
        });
      }
    }

    // 5. Apply Reciprocal Rank Fusion (RRF) & Multi-Page Diversity Re-ranking
    // Rank candidates by raw hybrid score
    scoredList.sort((a, b) => b.score - a.score);

    // Re-rank to ensure multi-page diversity (prevent 1 URL from dominating when other pages have answers)
    const diverseResults: RetrievedChunkResult[] = [];
    const urlOccurrenceCount = new Map<string, number>();

    for (const chunk of scoredList) {
      const u = chunk.sourceUrl || 'default';
      const count = urlOccurrenceCount.get(u) || 0;
      // Allow max 2 consecutive chunks from same URL if diverse results are still filling up
      if (count < 2 || diverseResults.length >= k - 2) {
        diverseResults.push(chunk);
        urlOccurrenceCount.set(u, count + 1);
      }
      if (diverseResults.length >= k) break;
    }

    // If diversity selection left room, fill up with remaining top chunks
    if (diverseResults.length < k) {
      for (const chunk of scoredList) {
        if (!diverseResults.some((r) => r.id === chunk.id)) {
          diverseResults.push(chunk);
        }
        if (diverseResults.length >= k) break;
      }
    }

    let topResults = diverseResults;

    // Fallback: If 0 results or top score is weak, fall back to project overview chunks
    if (topResults.length === 0 && allProjectChunks.length > 0) {
      topResults = allProjectChunks.slice(0, Math.min(3, k)).map((c: any) => ({
        id: c.id,
        projectId: c.projectId || projectId,
        content: c.content,
        metadata: typeof c.metadata === 'string' ? JSON.parse(c.metadata) : (c.metadata || {}),
        score: 0.50,
        sourceTitle: c.sourceTitle || (botConfig?.botName ? `${botConfig.botName} Overview` : 'Knowledge Base'),
        sourceUrl: c.sourceUrl || botConfig?.websiteUrl || '',
      }));
    }

    // Save in cache
    this.cache.set(cacheKey, {
      results: topResults,
      timestamp: Date.now(),
    });

    logger.info(`Hybrid retrieval for "${query}" (Project: ${projectId}, RealEstate: ${isRealEstate}): Found ${topResults.length} relevant chunks (top score: ${topResults[0]?.score.toFixed(2) || '0.00'})`);
    return topResults;

    // Save in cache
    this.cache.set(cacheKey, {
      results: topResults,
      timestamp: Date.now(),
    });

    logger.info(`Hybrid retrieval for "${query}" (Project: ${projectId}, RealEstate: ${isRealEstate}): Found ${topResults.length} relevant chunks (top score: ${topResults[0]?.score.toFixed(2) || '0.00'})`);
    return topResults;
  }

  /**
   * Format retrieved chunks into a clean grounded context block for LLM prompt
   */
  formatContextForPrompt(chunks: RetrievedChunkResult[], maxChunks = 6, botConfig?: { industry?: string; botName?: string }): string {
    const isRealEstate = botConfig?.industry === 'real-estate';
    if (!chunks || chunks.length === 0) {
      return isRealEstate
        ? 'No specific property records were retrieved for this query.'
        : 'No specific knowledge records were retrieved for this query in the knowledge base.';
    }

    // Filter out chunks that were heavily penalized (score <= 0) to ensure LLM context is clean
    const validChunks = chunks.filter((c) => c.score > 0);
    const chosen = validChunks.length > 0 ? validChunks.slice(0, maxChunks) : chunks.slice(0, maxChunks);

    let totalChars = 0;
    const maxTotalChars = 8000;
    const formattedBlocks: string[] = [];

    for (let i = 0; i < chosen.length; i++) {
      const c = chosen[i];
      // Cap each chunk to max 1500 characters to prevent oversized single chunks
      const chunkText = (c.content || '').slice(0, 1500).trim();
      const block = `[Source ${i + 1}: ${c.sourceTitle}${c.sourceUrl ? ` | ${c.sourceUrl}` : ''}]\n${chunkText}`;
      if (totalChars + block.length > maxTotalChars && formattedBlocks.length > 0) {
        break;
      }
      formattedBlocks.push(block);
      totalChars += block.length;
    }

    return formattedBlocks.join('\n\n---\n\n');
  }
}

export const retrievalService = new RetrievalService();
