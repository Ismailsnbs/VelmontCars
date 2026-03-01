import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisInstance: Redis | null = null;

function getRedisClient(): Redis {
  if (redisInstance) return redisInstance;

  const client = new Redis(REDIS_URL, {
    // Disable auto-reconnect on test environments to prevent open handles
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  });

  client.on('error', (err: Error) => {
    console.error('[Redis] Client error:', err.message);
  });

  client.on('connect', () => {
    console.log('[Redis] Connected');
  });

  client.on('reconnecting', () => {
    console.log('[Redis] Reconnecting...');
  });

  redisInstance = client;
  return client;
}

export const redis = getRedisClient();

export default redis;
