import { Redis } from "@upstash/redis";

// undefined = not created yet, null = not configured
let client: Redis | null | undefined;

/**
 * Shared Upstash Redis client, created on first use so `next build` doesn't need the
 * env vars. Returns null when they're missing; callers decide what that means.
 */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}
