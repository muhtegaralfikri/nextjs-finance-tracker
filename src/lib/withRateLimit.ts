import { NextResponse } from "next/server";
import { rateLimiters, getClientIp, RateLimitResult } from "./rateLimit";

type RateLimiterType = keyof typeof rateLimiters;

export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  limiterType: RateLimiterType = "api"
) {
  return async (request: Request): Promise<NextResponse> => {
    const ip = getClientIp(request);
    const limiter = rateLimiters[limiterType];
    const result: RateLimitResult = limiter(ip);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Terlalu banyak permintaan. Coba lagi nanti.",
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(limiterType === "api" ? 100 : limiterType === "auth" ? 10 : 10),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.reset),
          },
        }
      );
    }

    const response = await handler(request);
    
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.reset));
    
    return response;
  };
}

export function createRateLimitedHandler(
  handler: (request: Request) => Promise<NextResponse>,
  limiterType: RateLimiterType = "api"
) {
  return withRateLimit(handler, limiterType);
}
