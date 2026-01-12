/**
 * Simple in-memory rate limiting without external dependencies
 *
 * WARNING: This implementation has limitations:
 * - Rate limits reset when the server restarts
 * - Does not work across multiple server instances (not suitable for horizontal scaling)
 * - Memory usage grows with number of unique IPs
 *
 * For production with multiple instances, consider using Upstash Redis or similar.
 */

import { securityLog } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration from environment variables with sensible defaults and limits
const RATE_LIMIT_MAX_REQUESTS = Math.max(1, Math.min(
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
  1000 // Maximum allowed: 1000 requests per window
));

const RATE_LIMIT_WINDOW_HOURS = Math.max(0.1, Math.min(
  parseFloat(process.env.RATE_LIMIT_WINDOW_HOURS || '1'),
  24 // Maximum window: 24 hours
));

const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000;

// Log configuration on startup (always output)
securityLog.info(`[SECURITY:RATE_LIMIT] Configuration: ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW_HOURS} hour(s)`);

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      keysToDelete.push(key);
    }
  });
  
  if (keysToDelete.length > 0) {
    securityLog.info(`[SECURITY:RATE_LIMIT] Cleanup: Removed ${keysToDelete.length} expired rate limit entries`);
  }
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}, 5 * 60 * 1000);

/**
 * Get client IP address from request headers
 * Handles various proxy headers (Cloudflare, Vercel, etc.)
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  
  // Try various headers in order of preference
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp;
  
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  
  return "unknown";
}

/**
 * Check rate limit for a given identifier (usually IP address)
 * Returns success status and remaining requests
 */
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry exists or the window has expired, create a new one
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(identifier, newEntry);
    
    return {
      success: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      reset: newEntry.resetTime,
    };
  }

  // Check if limit already exceeded (don't increment if already over limit)
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      success: false,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Increment the count only if under limit
  entry.count++;

  return {
    success: true,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(identifier: string): {
  count: number;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    return {
      count: 0,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS,
      reset: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  return {
    count: entry.count,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count),
    reset: entry.resetTime,
  };
}

/**
 * Reset rate limit for a specific identifier (useful for testing or admin override)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get statistics about the rate limiter
 */
export function getRateLimitStats(): {
  totalTrackedIPs: number;
  memoryUsageEstimate: string;
} {
  const totalTrackedIPs = rateLimitStore.size;
  // Rough estimate: each entry is ~100 bytes (IP string + entry object)
  const memoryBytes = totalTrackedIPs * 100;
  const memoryKB = (memoryBytes / 1024).toFixed(2);
  
  return {
    totalTrackedIPs,
    memoryUsageEstimate: `~${memoryKB} KB`,
  };
}

// Made with Bob
