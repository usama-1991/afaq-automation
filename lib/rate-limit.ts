import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 1. Initialize Upstash Redis client if configured in environment
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// 2. Cache of Upstash Ratelimit instances (one per unique threshold)
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  const limiterKey = `${maxRequests}_${windowSeconds}`;
  if (!upstashLimiters.has(limiterKey)) {
    upstashLimiters.set(
      limiterKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
        analytics: true,
        prefix: 'ittisalo_ratelimit',
      })
    );
  }
  return upstashLimiters.get(limiterKey)!;
}

// 3. Fallback in-memory store for local development when Upstash env vars are unset
const localMemoryStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup expired local memory records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of localMemoryStore.entries()) {
      if (now > record.resetAt) {
        localMemoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
  reset: number;
}

/**
 * Checks rate limit for a specific identifier.
 * Uses Upstash Redis (serverless-compatible) in production, falling back to local memory if unconfigured.
 */
export async function checkRateLimit(
  endpoint: string,
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const identifier = `${endpoint}:${key}`;

  // Production Path: Upstash Redis (shared across all Vercel serverless lambdas)
  const limiter = getUpstashLimiter(maxRequests, windowSeconds);
  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      const retryAfter = result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      
      if (!result.success) {
        console.warn(
          `[RATE_LIMIT_EXCEEDED] 🚨 Endpoint: ${endpoint} | Key: ${key} | Limit: ${maxRequests}/${windowSeconds}s | RetryAfter: ${retryAfter}s (via Upstash Redis)`
        );
      }

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        retryAfter,
        reset: Math.ceil(result.reset / 1000),
      };
    } catch (err: any) {
      console.error(`[RateLimit] Upstash call failed, falling back to local memory: ${err.message}`);
    }
  }

  // Fallback Path: In-memory sliding window
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let record = localMemoryStore.get(identifier);

  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    localMemoryStore.set(identifier, record);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      retryAfter: 0,
      reset: Math.ceil(record.resetAt / 1000),
    };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    console.warn(
      `[RATE_LIMIT_EXCEEDED] 🚨 Endpoint: ${endpoint} | Key: ${key} | Limit: ${maxRequests}/${windowSeconds}s | RetryAfter: ${retryAfter}s (via Local Memory)`
    );
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      retryAfter,
      reset: Math.ceil(record.resetAt / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - record.count,
    retryAfter: 0,
    reset: Math.ceil(record.resetAt / 1000),
  };
}

/**
 * Helper to construct a standard 429 Too Many Requests response with standard rate limit headers.
 */
export function rateLimitResponse(limitResult: RateLimitResult) {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please try again in ${limitResult.retryAfter} seconds.`,
      retryAfter: limitResult.retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(limitResult.retryAfter),
        'X-RateLimit-Limit': String(limitResult.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(limitResult.reset),
      },
    }
  );
}

/**
 * Extracts client IP from incoming request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown-ip';
}
