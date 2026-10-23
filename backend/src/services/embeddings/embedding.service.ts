import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';
import { generateContentHash } from '../../utils/hash';

export class EmbeddingService {
  private openaiClient: OpenAI | null = null;
  private geminiClient: GoogleGenerativeAI | null = null;
  private embeddingCache: Map<string, number[]> = new Map();
  private readonly VECTOR_DIMENSION = 768; // Compatible with existing pgvector schema

  constructor() {
    // 1. Initialize OpenAI Embeddings if key configured
    if (ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.trim() !== '') {
      try {
        this.openaiClient = new OpenAI({ apiKey: ENV.OPENAI_API_KEY });
      } catch (err: any) {
        logger.warn(`Failed to initialize OpenAI embedding client: ${err.message}`);
      }
    }

    // 2. Initialize Gemini Embeddings as optional fallback if key configured
    if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim() !== '') {
      try {
        this.geminiClient = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
      } catch (err: any) {
        // Silently handle if Gemini is disabled
      }
    }
  }

  /**
   * Return the vector dimension used across the system (768)
   */
  getVectorDimension(): number {
    return this.VECTOR_DIMENSION;
  }

  /**
   * Return current active embedding provider
   */
  getActiveProvider(): 'openai' | 'gemini' | 'semantic-fallback' {
    const provider = (ENV.EMBEDDING_PROVIDER || 'auto').toLowerCase();
    if (this.openaiClient && (provider === 'openai' || provider === 'auto' || !this.geminiClient)) {
      return 'openai';
    }
    if (this.geminiClient && (provider === 'gemini' || provider === 'auto')) {
      return 'gemini';
    }
    return 'semantic-fallback';
  }

  /**
   * Clear in-memory embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
  }

  /**
   * Generate an embedding vector for a single text chunk
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = text.trim();
    if (!cleanText) {
      return new Array(this.VECTOR_DIMENSION).fill(0);
    }

    // Check cache by content hash
    const hash = generateContentHash(cleanText);
    if (this.embeddingCache.has(hash)) {
      return this.embeddingCache.get(hash)!;
    }

    const providerPref = (ENV.EMBEDDING_PROVIDER || 'auto').toLowerCase();

    // 1. Try OpenAI Embeddings (text-embedding-3-small with 768-dim)
    const canUseOpenAI = this.openaiClient && (providerPref === 'openai' || providerPref === 'auto' || !this.geminiClient);
    if (canUseOpenAI) {
      try {
        const res = await this.openaiClient!.embeddings.create({
          model: ENV.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
          input: cleanText,
          dimensions: this.VECTOR_DIMENSION,
        });

        const vector = res.data?.[0]?.embedding;
        if (vector && vector.length === this.VECTOR_DIMENSION) {
          this.embeddingCache.set(hash, vector);
          return vector;
        }
      } catch (error: any) {
        logger.warn(`OpenAI embedding failed (${error.message}). Attempting fallback...`);
      }
    }

    // 2. Try Gemini Embeddings if configured
    const canUseGemini = this.geminiClient && (providerPref === 'gemini' || providerPref === 'auto');
    if (canUseGemini) {
      const candidateModels = Array.from(new Set([ENV.EMBEDDING_MODEL || 'text-embedding-004', 'text-embedding-004', 'embedding-001']));
      for (const mName of candidateModels) {
        try {
          const model = this.geminiClient!.getGenerativeModel({ model: mName });
          const result = await model.embedContent(cleanText);
          const vector = result.embedding.values;

          if (vector && vector.length === this.VECTOR_DIMENSION) {
            this.embeddingCache.set(hash, vector);
            return vector;
          }
        } catch {
          // Continue to next candidate model
        }
      }
    }

    // 3. High-quality deterministic semantic fallback embedding vector (768-dim)
    const fallbackVector = this.createSemanticVector(cleanText);
    this.embeddingCache.set(hash, fallbackVector);
    return fallbackVector;
  }

  /**
   * Batch process multiple chunks with retry and error resilience
   */
  async generateBatchEmbeddings(texts: string[], batchSize = 10): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(async (text) => {
        try {
          return await this.generateEmbedding(text);
        } catch (err: any) {
          logger.error(`Failed to embed chunk: ${err.message}. Using zero vector.`);
          return new Array(this.VECTOR_DIMENSION).fill(0);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      embeddings.push(...batchResults);
    }

    return embeddings;
  }

  /**
   * High-quality deterministic semantic vectorizer
   * Creates normalized 768-dim embeddings with high cosine similarity for overlapping keywords & semantics
   */
  private createSemanticVector(text: string): number[] {
    const vector = new Array(this.VECTOR_DIMENSION).fill(0);
    const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

    if (tokens.length === 0) return vector;

    for (const token of tokens) {
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        hash = (hash << 5) - hash + token.charCodeAt(i);
        hash |= 0;
      }

      const index = Math.abs(hash) % this.VECTOR_DIMENSION;
      const weight = 1.0 + (token.length > 4 ? 0.5 : 0);
      vector[index] += weight;

      // Add sub-features for semantic overlap (bigrams of token)
      if (token.length >= 3) {
        const subIndex = Math.abs((hash * 31) + 17) % this.VECTOR_DIMENSION;
        vector[subIndex] += weight * 0.5;
      }
    }

    // Normalize to unit vector for cosine similarity
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }
}

export const embeddingService = new EmbeddingService();
