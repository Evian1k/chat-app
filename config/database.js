const knex = require('knex');
const config = require('../knexfile');
const logger = require('../utils/logger');

const environment = process.env.NODE_ENV || 'development';
const knexConfig = config[environment];

const db = knex(knexConfig);

async function initializeDatabase() {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    logger.info('Database connected successfully');
    
    // Run migrations
    await db.migrate.latest();
    logger.info('Database migrations completed');
    
    return db;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

// Database health check
async function checkDatabaseHealth() {
  try {
    await db.raw('SELECT 1');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Closing database connection...');
  await db.destroy();
});

process.on('SIGTERM', async () => {
  logger.info('Closing database connection...');
  await db.destroy();
});

module.exports = {
  db,
  initializeDatabase,
  checkDatabaseHealth
};