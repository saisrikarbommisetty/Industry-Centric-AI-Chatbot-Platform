/**
 * Vector calculation utilities for Cosine Similarity and pgvector format
 */

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Convert a float array into a pgvector string representation: '[0.1,0.2,...]'
 */
export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Parse a pgvector string representation '[0.1,0.2,...]' into a number array
 */
export function fromPgVector(vecStr: string | null | undefined): number[] {
  if (!vecStr) return [];
  const clean = vecStr.replace(/[\[\]]/g, '').trim();
  if (!clean) return [];
  return clean.split(',').map((n) => parseFloat(n.trim()));
}
