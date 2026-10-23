import { seedDatabase } from '../src/config/seed';
import { logger } from '../src/utils/logger';

export { seedDatabase };

// Execute automatically when run directly
if (process.argv[1] && process.argv[1].includes('seed')) {
  seedDatabase().catch((err) => {
    logger.error(`Seeding failed: ${err.message}`);
    process.exit(1);
  });
}
