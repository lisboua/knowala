import { redis } from '@/lib/redis'
import { RateLimitResult } from '@/types'

interface RateLimitConfig {
  key: string
  limit: number
  windowSeconds: number
}

export async function rateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = config
  const redisKey = `rate_limit:${key}`

  try {
    const current = await redis.incr(redisKey)

    if (current === 1) {
      await redis.expire(redisKey, windowSeconds)
    }

    const ttl = await redis.ttl(redisKey)
    const remaining = Math.max(0, limit - current)
    const reset = Math.floor(Date.now() / 1000) + ttl

    return {
      success: current <= limit,
      remaining,
      reset,
    }
  } catch (error) {
    // If Redis is down, allow the request (fail open)
    console.error('[RateLimit] Redis error:', error)
    return { success: true, remaining: limit, reset: 0 }
  }
}

// Pre-configured rate limiters

export async function rateLimitAnswer(userId: string, questionId: string): Promise<RateLimitResult> {
  // 1 answer per user per question - this is handled at DB level too
  return rateLimit({
    key: `answer:${userId}:${questionId}`,
    limit: 1,
    windowSeconds: 86400, // 24 hours
  })
}

export async function rateLimitComment(userId: string): Promise<RateLimitResult> {
  return rateLimit({
    key: `comment:${userId}`,
    limit: 30,
    windowSeconds: 3600, // 1 hour
  })
}

export async function rateLimitVote(userId: string): Promise<RateLimitResult> {
  return rateLimit({
    key: `vote:${userId}`,
    limit: 100,
    windowSeconds: 3600, // 1 hour
  })
}

export async function rateLimitReport(userId: string): Promise<RateLimitResult> {
  return rateLimit({
    key: `report:${userId}`,
    limit: 20,
    windowSeconds: 3600, // 1 hour
  })
}

export async function rateLimitLogin(ip: string): Promise<RateLimitResult> {
  return rateLimit({
    key: `login:${ip}`,
    limit: 5,
    windowSeconds: 900, // 15 minutes
  })
}

export async function rateLimitSuggestion(userId: string): Promise<RateLimitResult> {
  return rateLimit({
    key: `suggestion:${userId}`,
    limit: 5,
    windowSeconds: 3600, // 1 hour
  })
}

export async function rateLimitRegister(ip: string): Promise<RateLimitResult> {
  return rateLimit({
    key: `register:${ip}`,
    limit: 3,
    windowSeconds: 3600, // 1 hour
  })
}
