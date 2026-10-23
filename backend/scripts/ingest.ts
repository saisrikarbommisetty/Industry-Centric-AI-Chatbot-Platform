import { knowledgeController } from '../src/controllers/knowledge.controller';
import { projectRepository } from '../src/repositories/project.repository';
import { connectDatabase } from '../src/config/database';
import { ENV } from '../src/config/env';
import { logger } from '../src/utils/logger';

async function runIngest() {
  logger.info('=======================================================');
  logger.info('🚀 BRIM AI - PRYCOONS LIVE WEBSITE INGESTION PIPELINE');
  logger.info(`🌐 Target URL:   ${ENV.DEFAULT_PROJECT_URL}`);
  logger.info(`🤖 Embed Model:  ${ENV.EMBEDDING_MODEL}`);
  logger.info(`📄 Max Pages:    ${ENV.MAX_CRAWL_PAGES}`);
  logger.info('=======================================================');

  await connectDatabase();

  // 1. Ensure Prycoons project exists
  let project = await projectRepository.findById('prycoons-ai');
  if (!project) {
    project = await projectRepository.create({
      id: 'prycoons-ai',
      name: 'BRIM Real Estate Assistant',
      slug: 'prycoons-ai',
      industry: 'real-estate',
      industryName: 'Real Estate & Property',
      websiteUrl: ENV.DEFAULT_PROJECT_URL,
      description: 'Grounded Real Estate Assistant for Prycoons properties in Ahmedabad.',
      systemInstructions: 'Answer using verified Prycoons property data. Never invent property names or prices.',
      primaryColor: '#C85C4A',
    });
  }

  // 2. Run Crawler & Ingestion Pipeline
  const startTime = Date.now();
  const summary = await knowledgeController.runIngestionPipeline(
    project.id,
    project.websiteUrl || ENV.DEFAULT_PROJECT_URL,
    ENV.MAX_CRAWL_PAGES
  );
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // 3. Print Output Summary
  console.log('\n=======================================================');
  console.log('📊 INGESTION PIPELINE SUMMARY REPORT');
  console.log('=======================================================');
  console.log(`Pages discovered:     ${summary.pagesDiscovered}`);
  console.log(`Pages processed:      ${summary.pagesProcessed}`);
  console.log(`Documents created:    ${summary.documentsCreated}`);
  console.log(`Chunks created:       ${summary.chunksCreated}`);
  console.log(`Embeddings generated: ${summary.embeddingsGenerated}`);
  console.log(`Skipped unchanged:    ${summary.skippedUnchanged}`);
  console.log(`Failed:               ${summary.failed}`);
  console.log(`Execution time:       ${elapsedSec}s`);
  console.log('=======================================================\n');
}

runIngest()
  .then(() => {
    logger.info('Ingestion completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error(`Ingestion failed: ${err.message}`);
    process.exit(1);
  });
