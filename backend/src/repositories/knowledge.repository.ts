import { prisma, isDatabaseConnected } from '../config/database';
import { cosineSimilarity, toPgVector, fromPgVector } from '../utils/vector';
import { logger } from '../utils/logger';

// In-memory fallback stores
const memorySources: Map<string, any> = new Map();
const memoryDocuments: Map<string, any> = new Map();
const memoryChunks: Map<string, any> = new Map();

type KnowledgeChangeListener = (projectId?: string) => void;
const knowledgeChangeListeners: KnowledgeChangeListener[] = [];

export function onKnowledgeChange(listener: KnowledgeChangeListener) {
  knowledgeChangeListeners.push(listener);
}

export function notifyKnowledgeChange(projectId?: string) {
  knowledgeChangeListeners.forEach((fn) => {
    try {
      fn(projectId);
    } catch (err: any) {
      logger.warn(`Error in knowledge change listener: ${err.message}`);
    }
  });
}

export class KnowledgeRepository {
  // ── KNOWLEDGE SOURCES ───────────────────────────────────────────────────

  async createSource(data: {
    id?: string;
    projectId: string;
    type?: string;
    url: string;
    title: string;
    status?: string;
    size?: string;
    extractedSummary?: string;
  }): Promise<any> {
    const id = data.id || `src-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sourceRecord = {
      id,
      projectId: data.projectId,
      type: (data.type || 'URL').toUpperCase() as any,
      url: data.url,
      title: data.title,
      status: (data.status || 'PENDING').toUpperCase() as any,
      size: data.size || '180 KB',
      extractedSummary: data.extractedSummary || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastCrawledAt: null,
      lastIndexedAt: null,
      contentHash: null,
      errorMessage: null,
    };

    if (isDatabaseConnected) {
      try {
        return await prisma.knowledgeSource.upsert({
          where: { id },
          update: sourceRecord as any,
          create: sourceRecord as any,
        });
      } catch (err: any) {
        logger.warn(`createSource DB error: ${err.message}. Saving in memory.`);
      }
    }

    memorySources.set(id, sourceRecord);
    return sourceRecord;
  }

  async getSourcesByProjectId(projectId: string): Promise<any[]> {
    if (isDatabaseConnected) {
      try {
        const sources = await prisma.knowledgeSource.findMany({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { documents: true } },
          },
        });
        if (sources.length > 0) return sources;
      } catch (err: any) {
        logger.warn(`getSourcesByProjectId DB error: ${err.message}.`);
      }
    }

    return Array.from(memorySources.values()).filter((s) => s.projectId === projectId);
  }

  async getSourceById(id: string): Promise<any | null> {
    if (isDatabaseConnected) {
      try {
        const source = await prisma.knowledgeSource.findUnique({
          where: { id },
          include: { documents: true },
        });
        if (source) return source;
      } catch (err: any) {
        logger.warn(`getSourceById DB error: ${err.message}.`);
      }
    }
    return memorySources.get(id) || null;
  }

  async updateSource(id: string, updates: any): Promise<any> {
    if (isDatabaseConnected) {
      try {
        return await prisma.knowledgeSource.update({ where: { id }, data: updates });
      } catch (err: any) {
        logger.warn(`updateSource DB error: ${err.message}.`);
      }
    }
    const existing = memorySources.get(id) || {};
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    memorySources.set(id, updated);
    return updated;
  }

  async deleteSource(id: string): Promise<boolean> {
    if (isDatabaseConnected) {
      try {
        await prisma.knowledgeSource.delete({ where: { id } });
      } catch (err: any) {
        logger.warn(`deleteSource DB error: ${err.message}.`);
      }
    }
    memorySources.delete(id);
    // Cascade delete documents and chunks in memory
    for (const [docId, doc] of memoryDocuments.entries()) {
      if (doc.sourceId === id) {
        memoryDocuments.delete(docId);
        for (const [chunkId, chunk] of memoryChunks.entries()) {
          if (chunk.documentId === docId) {
            memoryChunks.delete(chunkId);
          }
        }
      }
    }
    return true;
  }

  // ── KNOWLEDGE DOCUMENTS ─────────────────────────────────────────────────

  async createDocument(data: {
    id?: string;
    sourceId: string;
    projectId: string;
    title: string;
    url: string;
    content: string;
    metadata?: Record<string, any>;
    contentHash: string;
  }): Promise<any> {
    const id = data.id || `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const docRecord = {
      id,
      sourceId: data.sourceId,
      projectId: data.projectId,
      title: data.title,
      url: data.url,
      content: data.content,
      metadata: data.metadata || {},
      contentHash: data.contentHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isDatabaseConnected) {
      try {
        return await prisma.knowledgeDocument.upsert({
          where: { id },
          update: docRecord as any,
          create: docRecord as any,
        });
      } catch (err: any) {
        logger.warn(`createDocument DB error: ${err.message}. Storing in memory.`);
      }
    }

    memoryDocuments.set(id, docRecord);
    return docRecord;
  }

  async findDocumentByUrl(projectId: string, url: string): Promise<any | null> {
    if (isDatabaseConnected) {
      try {
        const doc = await prisma.knowledgeDocument.findFirst({
          where: { projectId, url },
        });
        if (doc) return doc;
      } catch (err: any) {
        logger.warn(`findDocumentByUrl DB error: ${err.message}.`);
      }
    }

    for (const doc of memoryDocuments.values()) {
      if (doc.projectId === projectId && doc.url === url) {
        return doc;
      }
    }
    return null;
  }

  async getDocumentsByProjectId(projectId: string): Promise<any[]> {
    if (isDatabaseConnected) {
      try {
        return await prisma.knowledgeDocument.findMany({
          where: { projectId },
          include: { chunks: true },
        });
      } catch (err: any) {
        logger.warn(`getDocumentsByProjectId DB error: ${err.message}.`);
      }
    }

    return Array.from(memoryDocuments.values()).filter((d) => d.projectId === projectId);
  }

  async deleteDocumentChunks(documentId: string): Promise<void> {
    if (isDatabaseConnected) {
      try {
        await prisma.knowledgeChunk.deleteMany({ where: { documentId } });
      } catch (err: any) {
        logger.warn(`deleteDocumentChunks DB error: ${err.message}.`);
      }
    }

    for (const [id, chunk] of memoryChunks.entries()) {
      if (chunk.documentId === documentId) {
        memoryChunks.delete(id);
      }
    }
    notifyKnowledgeChange();
  }

  // ── KNOWLEDGE CHUNKS & VECTOR RETRIEVAL ──────────────────────────────────

  async createChunk(data: {
    id?: string;
    documentId: string;
    projectId: string;
    content: string;
    embedding?: number[];
    metadata?: Record<string, any>;
    chunkIndex: number;
  }): Promise<any> {
    const id = data.id || `chk-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const chunkRecord = {
      id,
      documentId: data.documentId,
      projectId: data.projectId,
      content: data.content,
      metadata: data.metadata || {},
      chunkIndex: data.chunkIndex,
      createdAt: new Date(),
    };

    if (isDatabaseConnected) {
      try {
        await prisma.knowledgeChunk.upsert({
          where: { id },
          update: chunkRecord,
          create: chunkRecord,
        });
        if (data.embedding && data.embedding.length > 0) {
          const vecStr = toPgVector(data.embedding);
          await prisma.$executeRaw`
            UPDATE "KnowledgeChunk"
            SET embedding = ${vecStr}::vector
            WHERE id = ${id};
          `;
        }
      } catch (err: any) {
        logger.warn(`createChunk DB error: ${err.message}. Storing in memory.`);
      }
    }

    memoryChunks.set(id, { ...chunkRecord, embedding: data.embedding || [] });
    notifyKnowledgeChange(data.projectId);
    return { ...chunkRecord, embedding: data.embedding || [] };
  }

  async findSimilarChunks(
    projectId: string,
    queryEmbedding: number[],
    limit = 6,
    minSimilarity = 0.35
  ): Promise<any[]> {
    // 1. Try PostgreSQL + pgvector query
    if (isDatabaseConnected && queryEmbedding && queryEmbedding.length > 0) {
      try {
        const vecStr = toPgVector(queryEmbedding);
        const results: any[] = await prisma.$queryRaw`
          SELECT 
            c.id, 
            c."documentId", 
            c."projectId", 
            c.content, 
            c.metadata, 
            c."chunkIndex",
            d.title AS "docTitle",
            d.url AS "docUrl",
            1 - (c.embedding <=> ${vecStr}::vector) AS similarity
          FROM "KnowledgeChunk" c
          JOIN "KnowledgeDocument" d ON c."documentId" = d.id
          WHERE c."projectId" = ${projectId} AND c.embedding IS NOT NULL
          ORDER BY c.embedding <=> ${vecStr}::vector
          LIMIT ${limit};
        `;

        if (results && results.length > 0) {
          return results
            .filter((r) => r.similarity >= minSimilarity)
            .map((r) => ({
              id: r.id,
              documentId: r.documentId,
              projectId: r.projectId,
              content: r.content,
              metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
              chunkIndex: r.chunkIndex,
              similarity: parseFloat(r.similarity),
              sourceTitle: r.docTitle,
              sourceUrl: r.docUrl,
            }));
        }
      } catch (err: any) {
        logger.warn(`pgvector query execution failed: ${err.message}. Falling back to memory vector search.`);
      }
    }

    // 2. In-memory cosine similarity fallback
    const projectChunks = Array.from(memoryChunks.values()).filter((c) => c.projectId === projectId);
    const scoredChunks = projectChunks
      .map((chunk) => {
        const sim = queryEmbedding && queryEmbedding.length > 0 && chunk.embedding && chunk.embedding.length > 0
          ? cosineSimilarity(queryEmbedding, chunk.embedding)
          : 0.5; // Neutral relevance if no embedding
        const parentDoc = memoryDocuments.get(chunk.documentId);
        return {
          id: chunk.id,
          documentId: chunk.documentId,
          projectId: chunk.projectId,
          content: chunk.content,
          metadata: chunk.metadata || {},
          chunkIndex: chunk.chunkIndex,
          similarity: sim,
          sourceTitle: parentDoc?.title || chunk.metadata?.projectName || 'Knowledge Base',
          sourceUrl: parentDoc?.url || chunk.metadata?.sourceUrl || 'https://prycoons.com/',
        };
      })
      .filter((c) => c.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return scoredChunks;
  }

  async getAllChunks(projectId: string): Promise<any[]> {
    if (isDatabaseConnected) {
      try {
        const chunks = await prisma.knowledgeChunk.findMany({
          where: { projectId },
          include: {
            document: { select: { title: true, url: true } },
          },
        });
        if (chunks.length > 0) {
          return chunks.map((c) => ({
            ...c,
            sourceTitle: c.document.title,
            sourceUrl: c.document.url,
          }));
        }
      } catch (err: any) {
        logger.warn(`getAllChunks DB error: ${err.message}.`);
      }
    }

    return Array.from(memoryChunks.values()).filter((c) => c.projectId === projectId);
  }
}

export const knowledgeRepository = new KnowledgeRepository();
