type RateLimitStore = Map<string, { count: number; resetTime: number }>;

const stores: Map<string, RateLimitStore> = new Map();

export interface RateLimitConfig {
  interval: number; // in milliseconds
  limit: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig,
  storeName = "default"
): RateLimitResult {
  const { interval, limit } = config;
  const now = Date.now();

  if (!stores.has(storeName)) {
    stores.set(storeName, new Map());
  }
  const store = stores.get(storeName)!;

  const record = store.get(identifier);

  if (!record || now >= record.resetTime) {
    store.set(identifier, { count: 1, resetTime: now + interval });
    return { success: true, remaining: limit - 1, reset: now + interval };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetTime };
  }

  record.count++;
  return { success: true, remaining: limit - record.count, reset: record.resetTime };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  stores.forEach((store) => {
    store.forEach((record, key) => {
      if (now >= record.resetTime) {
        store.delete(key);
      }
    });
  });
}, 60000); // Clean every minute

// Pre-configured rate limiters
export const rateLimiters = {
  api: (ip: string) =>
    rateLimit(ip, { interval: 60000, limit: 100 }, "api"), // 100 req/min
  auth: (ip: string) =>
    rateLimit(ip, { interval: 900000, limit: 10 }, "auth"), // 10 req/15min
  strict: (ip: string) =>
    rateLimit(ip, { interval: 60000, limit: 10 }, "strict"), // 10 req/min
};

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}
