import crypto from 'crypto';

/**
 * Generate a SHA-256 hash of a string for content change detection
 */
export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content.trim()).digest('hex');
}
