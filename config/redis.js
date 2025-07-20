const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

async function initializeRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis connection refused');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready for operations');
    });

    redisClient.on('end', () => {
      logger.info('Redis connection ended');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Redis initialization failed:', error);
    throw error;
  }
}

// Session management
async function setUserSession(userId, sessionData, ttl = 86400) {
  try {
    const key = `session:${userId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(sessionData));
    return true;
  } catch (error) {
    logger.error('Failed to set user session:', error);
    return false;
  }
}

async function getUserSession(userId) {
  try {
    const key = `session:${userId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Failed to get user session:', error);
    return null;
  }
}

async function deleteUserSession(userId) {
  try {
    const key = `session:${userId}`;
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Failed to delete user session:', error);
    return false;
  }
}

// Online users management
async function setUserOnline(userId, socketId) {
  try {
    await redisClient.hSet('online_users', userId, socketId);
    await redisClient.sAdd('active_users', userId);
    return true;
  } catch (error) {
    logger.error('Failed to set user online:', error);
    return false;
  }
}

async function setUserOffline(userId) {
  try {
    await redisClient.hDel('online_users', userId);
    await redisClient.sRem('active_users', userId);
    return true;
  } catch (error) {
    logger.error('Failed to set user offline:', error);
    return false;
  }
}

async function getOnlineUsers() {
  try {
    return await redisClient.sMembers('active_users');
  } catch (error) {
    logger.error('Failed to get online users:', error);
    return [];
  }
}

async function isUserOnline(userId) {
  try {
    return await redisClient.sIsMember('active_users', userId.toString());
  } catch (error) {
    logger.error('Failed to check if user is online:', error);
    return false;
  }
}

// Chat room management
async function joinRoom(userId, roomId) {
  try {
    await redisClient.sAdd(`room:${roomId}`, userId);
    await redisClient.sAdd(`user_rooms:${userId}`, roomId);
    return true;
  } catch (error) {
    logger.error('Failed to join room:', error);
    return false;
  }
}

async function leaveRoom(userId, roomId) {
  try {
    await redisClient.sRem(`room:${roomId}`, userId);
    await redisClient.sRem(`user_rooms:${userId}`, roomId);
    return true;
  } catch (error) {
    logger.error('Failed to leave room:', error);
    return false;
  }
}

async function getRoomUsers(roomId) {
  try {
    return await redisClient.sMembers(`room:${roomId}`);
  } catch (error) {
    logger.error('Failed to get room users:', error);
    return [];
  }
}

// Cache management
async function setCache(key, value, ttl = 3600) {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Failed to set cache:', error);
    return false;
  }
}

async function getCache(key) {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Failed to get cache:', error);
    return null;
  }
}

async function deleteCache(key) {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Failed to delete cache:', error);
    return false;
  }
}

// Redis health check
async function checkRedisHealth() {
  try {
    await redisClient.ping();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (redisClient) {
    logger.info('Closing Redis connection...');
    await redisClient.quit();
  }
});

process.on('SIGTERM', async () => {
  if (redisClient) {
    logger.info('Closing Redis connection...');
    await redisClient.quit();
  }
});

module.exports = {
  redisClient,
  initializeRedis,
  setUserSession,
  getUserSession,
  deleteUserSession,
  setUserOnline,
  setUserOffline,
  getOnlineUsers,
  isUserOnline,
  joinRoom,
  leaveRoom,
  getRoomUsers,
  setCache,
  getCache,
  deleteCache,
  checkRedisHealth
};