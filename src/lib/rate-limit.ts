const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(key: string, options: RateLimitOptions): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1, resetAt: now + options.windowMs };
  }

  if (entry.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: options.maxRequests - entry.count, resetAt: entry.resetAt };
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    });
  }, 5 * 60 * 1000);
}

// Predefined rate limits
export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 min
  api: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
  register: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 registrations per hour
} as const;
