import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Limiters = { perIp: Ratelimit; global: Ratelimit };

// undefined = not created yet, null = not configured
let limiters: Limiters | null | undefined;

function getLimiters(): Limiters | null {
  if (limiters !== undefined) return limiters;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn("Rate limiting is off: Upstash environment variables are missing");
    limiters = null;
    return null;
  }

  const redis = new Redis({ url, token });
  limiters = {
    perIp: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "10 m"),
      prefix: "portfolio:contact:ip",
    }),
    global: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(30, "1 d"),
      prefix: "portfolio:contact:global",
    }),
  };
  return limiters;
}

export function getClientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export type LimitResult = { ok: true } | { ok: false; retryAfter: number };

const secondsUntil = (resetMs: number) => Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));

export async function checkContactLimit(ip: string): Promise<LimitResult> {
  const l = getLimiters();
  if (!l) return { ok: true };

  try {
    const perIp = await l.perIp.limit(ip);
    if (!perIp.success) return { ok: false, retryAfter: secondsUntil(perIp.reset) };

    const global = await l.global.limit("all");
    if (!global.success) return { ok: false, retryAfter: secondsUntil(global.reset) };

    return { ok: true };
  } catch (error) {
    // Fail open: a limiter outage shouldn't block real visitors
    console.error("Rate limiter error:", error);
    return { ok: true };
  }
}
