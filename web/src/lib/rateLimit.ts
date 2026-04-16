import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Shared Redis client — reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Translate endpoint: AI/external API call — keep limits tight.
 * 20 requests per minute per user/IP.
 */
export const translateRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:translate",
  analytics: true,
});

/**
 * Words lookup endpoint: lightweight read — more permissive.
 * 60 requests per minute per user/IP.
 */
export const wordsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "rl:words",
  analytics: true,
});

/**
 * Speech endpoint: GoogleSpeech API - keep limits tight.
 * 20 requests per minute per user/IP.
 */
export const speechRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:speech",
  analytics: true,
});

/**
 * QA endpoint: Gemini API - keep limits tight.
 * 20 requests per minute per user/IP.
 */
export const qaRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:qa",
  analytics: true,
});

/**
 * Auth session endpoint: IP-keyed only (no session exists yet at sign-in).
 * 10 requests per minute per IP — tight to deter credential stuffing.
 */
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:auth",
  analytics: true,
});
