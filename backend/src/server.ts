import app from './app';
import { initSchema, testConnection } from './config/database';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

const start = async () => {
  const dbOk = await testConnection();
  if (dbOk) {
    await initSchema();
  }
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API Docs available at http://localhost:${PORT}/api-docs`);
    logger.info(`Health check at http://localhost:${PORT}/health`);
  });
};

start();
