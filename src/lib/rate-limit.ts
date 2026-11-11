import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

type Limiters = { perIp: Ratelimit; global: Ratelimit };

type LimiterConfig = {
  perIp: ReturnType<typeof Ratelimit.slidingWindow>;
  global: ReturnType<typeof Ratelimit.fixedWindow>;
  prefix: string;
};

const configs = {
  contact: {
    perIp: Ratelimit.slidingWindow(3, "10 m"),
    global: Ratelimit.fixedWindow(30, "1 d"),
    prefix: "portfolio:contact",
  },
  waitlist: {
    perIp: Ratelimit.slidingWindow(5, "10 m"),
    global: Ratelimit.fixedWindow(200, "1 d"),
    prefix: "portfolio:waitlist",
  },
} satisfies Record<string, LimiterConfig>;

type LimiterName = keyof typeof configs;

// Per form: undefined = not created yet, null = not configured
const limiters: Partial<Record<LimiterName, Limiters | null>> = {};

function getLimiters(name: LimiterName): Limiters | null {
  const cached = limiters[name];
  if (cached !== undefined) return cached;

  const redis = getRedis();
  if (!redis) {
    console.warn("Rate limiting is off: Upstash environment variables are missing");
    limiters[name] = null;
    return null;
  }

  const { perIp, global, prefix } = configs[name];
  const created = {
    perIp: new Ratelimit({ redis, limiter: perIp, prefix: `${prefix}:ip` }),
    global: new Ratelimit({ redis, limiter: global, prefix: `${prefix}:global` }),
  };
  limiters[name] = created;
  return created;
}

export function getClientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export type LimitResult = { ok: true } | { ok: false; retryAfter: number };

const secondsUntil = (resetMs: number) => Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));

async function check(name: LimiterName, ip: string): Promise<LimitResult> {
  const l = getLimiters(name);
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

/** Contact form: 3 per IP per 10 minutes, 30 a day overall */
export const checkContactLimit = (ip: string) => check("contact", ip);

/** Deskcloud waitlist: 5 per IP per 10 minutes, 200 a day overall */
export const checkWaitlistLimit = (ip: string) => check("waitlist", ip);
