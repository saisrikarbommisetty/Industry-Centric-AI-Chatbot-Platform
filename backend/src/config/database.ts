import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ENV } from './env';

// Global Prisma Client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient({
  log: ENV.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (ENV.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export let isDatabaseConnected = false;

export async function connectDatabase(): Promise<boolean> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      // Test a lightweight query
      await prisma.$queryRaw`SELECT 1;`;
      // Ensure live PostgreSQL schema stays synced for incremental additions
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "SourceType" ADD VALUE IF NOT EXISTS 'SOCIAL_MEDIA';`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "userId" TEXT;`);
      } catch {
        // Non-fatal if DB permissions restrict DDL or already applied
      }
      isDatabaseConnected = true;
      logger.info('Connected to PostgreSQL database successfully.');
      return true;
    } catch (error: any) {
      if (attempt < maxRetries) {
        logger.warn(`PostgreSQL connection attempt ${attempt} failed: ${error.message}. Retrying in 1.5s...`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        isDatabaseConnected = false;
        logger.warn(`PostgreSQL connection failed after ${maxRetries} attempts: ${error.message}. Running with resilient fallback storage.`);
        return false;
      }
    }
  }
  return false;
}

