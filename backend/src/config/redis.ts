import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_ENABLED = process.env.REDIS_HOST !== undefined && process.env.REDIS_HOST !== '';

export const redis = REDIS_ENABLED
  ? new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const maxDelay = 5000;
        const delay = Math.min(times * 200, maxDelay);
        return delay;
      },
    })
  : null;

if (redis) {
  redis.on('connect', () => {
    console.log('[Redis] Connected');
  });

  redis.on('error', (err) => {
    console.error('[Redis] Error:', err.message);
  });
}

// Cache helpers — null-safe wrapper so the app works without Redis
export const cacheGet = async (key: string): Promise<string | null> => {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    console.error('[Redis] Cache get error:', err);
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: string,
  ttlSeconds: number = 3600
): Promise<void> => {
  if (!redis) return;
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch (err) {
    console.error('[Redis] Cache set error:', err);
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error('[Redis] Cache delete error:', err);
  }
};
