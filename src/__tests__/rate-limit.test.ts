import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  it("allows first request", () => {
    const result = checkRateLimit("test-key", { windowMs: 60000, maxRequests: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks multiple requests", () => {
    const key = "multi-test";
    const opts = { windowMs: 60000, maxRequests: 3 };

    expect(checkRateLimit(key, opts).remaining).toBe(2);
    expect(checkRateLimit(key, opts).remaining).toBe(1);
    expect(checkRateLimit(key, opts).remaining).toBe(0);
  });

  it("blocks after max requests", () => {
    const key = "block-test";
    const opts = { windowMs: 60000, maxRequests: 2 };

    checkRateLimit(key, opts);
    checkRateLimit(key, opts);
    const result = checkRateLimit(key, opts);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const key = "reset-test";
    const opts = { windowMs: 60000, maxRequests: 1 };

    checkRateLimit(key, opts);
    const blocked = checkRateLimit(key, opts);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(61000);
    const allowed = checkRateLimit(key, opts);
    expect(allowed.allowed).toBe(true);
    expect(allowed.remaining).toBe(0);
  });

  it("uses predefined RATE_LIMITS", () => {
    expect(RATE_LIMITS.auth.windowMs).toBe(15 * 60 * 1000);
    expect(RATE_LIMITS.auth.maxRequests).toBe(5);
    expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000);
    expect(RATE_LIMITS.api.maxRequests).toBe(60);
    expect(RATE_LIMITS.register.windowMs).toBe(60 * 60 * 1000);
    expect(RATE_LIMITS.register.maxRequests).toBe(10);
  });
});
