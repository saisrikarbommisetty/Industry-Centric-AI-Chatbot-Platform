import { app } from './app';
import { ENV, validateEnvironment } from './config/env';
import { connectDatabase } from './config/database';
import { seedDatabase } from './config/seed';
import { logger } from './utils/logger';

async function startServer() {
  try {
    // Attempt database connection (gracefully falls back if offline)
    await connectDatabase();
    
    // Auto-seed demo user & verified knowledge records
    await seedDatabase().catch((e) => logger.warn(`Auto-seed note: ${e.message}`));

    // Validate environment configuration
    const envCheck = validateEnvironment();
    if (envCheck.warnings.length > 0) {
      envCheck.warnings.forEach((w) => logger.warn(`[CONFIG] ${w}`));
    }

    const server = app.listen(ENV.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`🚀 BRIM AI Chatbot Backend Server Running`);
      logger.info(`📡 Port:         http://localhost:${ENV.PORT}`);
      logger.info(`🩺 Health:       http://localhost:${ENV.PORT}/health`);
      logger.info(`🤖 AI Provider:  OpenAI`);
      logger.info(`🧠 OpenAI Model: ${ENV.OPENAI_MODEL}`);
      logger.info(`📐 Embed Model:  ${ENV.OPENAI_EMBEDDING_MODEL} (${ENV.EMBEDDING_DIMENSION}-dim)`);
      logger.info(`🌐 Default URL:  ${ENV.DEFAULT_PROJECT_URL}`);
      logger.info(`=======================================================`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error: any) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();
