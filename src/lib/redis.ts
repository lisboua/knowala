import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient(): Redis {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 3) {
        return null
      }
      return Math.min(times * 200, 2000)
    },
    enableOfflineQueue: false,
  })

  redis.on('error', (err: Error) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[Redis] Connection error:', err.message)
    }
  })

  redis.on('connect', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Redis] Connected')
    }
  })

  return redis
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
