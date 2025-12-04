import { rateLimit, rateLimiters } from "@/lib/rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should allow requests within limit", () => {
    const config = { interval: 60000, limit: 3 };
    
    const result1 = rateLimit("user1", config, "test1");
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = rateLimit("user1", config, "test1");
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = rateLimit("user1", config, "test1");
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it("should block requests exceeding limit", () => {
    const config = { interval: 60000, limit: 2 };
    
    rateLimit("user2", config, "test2");
    rateLimit("user2", config, "test2");
    
    const result = rateLimit("user2", config, "test2");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should reset after interval", () => {
    const config = { interval: 1000, limit: 1 };
    
    rateLimit("user3", config, "test3");
    const blockedResult = rateLimit("user3", config, "test3");
    expect(blockedResult.success).toBe(false);

    jest.advanceTimersByTime(1001);

    const resetResult = rateLimit("user3", config, "test3");
    expect(resetResult.success).toBe(true);
    expect(resetResult.remaining).toBe(0);
  });

  it("should track different identifiers separately", () => {
    const config = { interval: 60000, limit: 1 };
    
    const resultA = rateLimit("userA", config, "test4");
    const resultB = rateLimit("userB", config, "test4");
    
    expect(resultA.success).toBe(true);
    expect(resultB.success).toBe(true);
  });
});

describe("rateLimiters", () => {
  it("should have predefined limiters", () => {
    expect(rateLimiters.api).toBeDefined();
    expect(rateLimiters.auth).toBeDefined();
    expect(rateLimiters.strict).toBeDefined();
  });
});
