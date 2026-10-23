import { prisma, isDatabaseConnected, connectDatabase } from '../src/config/database';
import { embeddingService } from '../src/services/embeddings/embedding.service';
import { toPgVector } from '../src/utils/vector';
import { ENV } from '../src/config/env';
import { logger } from '../src/utils/logger';

async function runReindexing() {
  logger.info('=======================================================');
  logger.info('🔄 BRIM AI - SAFE KNOWLEDGE RE-EMBEDDING PIPELINE');
  logger.info(`🤖 Active Provider:  ${embeddingService.getActiveProvider()}`);
  logger.info(`🧠 OpenAI Model:     ${ENV.OPENAI_EMBEDDING_MODEL}`);
  logger.info(`📐 Vector Dimension: ${embeddingService.getVectorDimension()}`);
  logger.info('=======================================================');

  await connectDatabase();

  if (!isDatabaseConnected) {
    logger.warn('Database is not connected. In-memory embeddings are refreshed on-the-fly.');
    process.exit(0);
  }

  // Fetch all chunks
  const chunks = await prisma.knowledgeChunk.findMany({
    select: {
      id: true,
      content: true,
      projectId: true,
      chunkIndex: true,
    },
  });

  logger.info(`Found ${chunks.length} knowledge chunks to re-embed.`);
  if (chunks.length === 0) {
    logger.info('No chunks found to re-embed. Pipeline complete.');
    process.exit(0);
  }

  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (chunk) => {
        try {
          const vector = await embeddingService.generateEmbedding(chunk.content);
          if (vector && vector.length === embeddingService.getVectorDimension()) {
            const vecStr = toPgVector(vector);
            await prisma.$executeRaw`
              UPDATE "KnowledgeChunk"
              SET embedding = ${vecStr}::vector
              WHERE id = ${chunk.id};
            `;
            successCount++;
          } else {
            failCount++;
            logger.warn(`Invalid vector generated for chunk ${chunk.id}`);
          }
        } catch (err: any) {
          failCount++;
          logger.error(`Error re-embedding chunk ${chunk.id}: ${err.message}`);
        }
      })
    );

    const percent = Math.round(((i + batch.length) / chunks.length) * 100);
    logger.info(`Progress: ${i + batch.length}/${chunks.length} chunks (${percent}%)`);
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n=======================================================');
  console.log('📊 RE-EMBEDDING SUMMARY REPORT');
  console.log('=======================================================');
  console.log(`Total Chunks:        ${chunks.length}`);
  console.log(`Successfully Updated: ${successCount}`);
  console.log(`Failed:              ${failCount}`);
  console.log(`Time Elapsed:        ${elapsedSec}s`);
  console.log('=======================================================\n');
}

runReindexing()
  .then(() => {
    logger.info('Re-embedding pipeline finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error(`Re-embedding failed: ${err.message}`);
    process.exit(1);
  });
