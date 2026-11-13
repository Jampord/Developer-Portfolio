import { createHash, randomBytes } from "node:crypto";

/**
 * Profile views: one per visitor per day, counted for the whole site.
 *
 * A visitor is recognised by a hash of their IP, browser and the day, mixed with a random salt
 * that exists only in Redis and expires after two days. No IP is stored, no cookie is set, and
 * once the salt is gone a day's hashes can't be traced back to anyone.
 */

const PREFIX = "portfolio:views";
export const TOTAL_KEY = `${PREFIX}:total`;
const saltKey = (day: string) => `${PREFIX}:salt:${day}`;
const seenKey = (day: string) => `${PREFIX}:seen:${day}`;

/** How long a day's salt and visitor list are kept, in seconds */
const KEEP_FOR = 2 * 24 * 60 * 60;

/** Below this the count isn't shown, so a small early number never greets a recruiter */
export const VIEWS_THRESHOLD = 20;

/** The day a view belongs to (UTC), e.g. "2026-11-13" */
export const dayOf = (now: Date) => now.toISOString().slice(0, 10);

/** Crawlers, previews and scripts: anything that says it isn't a person */
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch|go-http/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}

export function visitorId(ip: string, userAgent: string, day: string, salt: string): string {
  return createHash("sha256").update(`${salt}|${day}|${ip}|${userAgent}`).digest("hex");
}

/** The total, or null while it is under the threshold */
export function shownViews(total: number | null): number | null {
  return total !== null && total >= VIEWS_THRESHOLD ? total : null;
}

/** The few Redis commands the counter needs (a subset of @upstash/redis) */
export type ViewsStore = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: string, opts: { nx: true; ex: number }): Promise<unknown>;
  sadd(key: string, member: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  incr(key: string): Promise<number>;
};

/** This day's salt, made the first time it's needed. Two requests racing both read the winner's. */
async function saltFor(store: ViewsStore, day: string): Promise<string> {
  const existing = await store.get<string>(saltKey(day));
  if (existing) return existing;
  await store.set(saltKey(day), randomBytes(16).toString("hex"), { nx: true, ex: KEEP_FOR });
  return (await store.get<string>(saltKey(day))) ?? "";
}

/** Count this visitor if they haven't been counted today, and return the total */
export async function recordView(
  store: ViewsStore,
  { ip, userAgent, now }: { ip: string; userAgent: string; now: Date },
): Promise<number> {
  const day = dayOf(now);
  const id = visitorId(ip, userAgent, day, await saltFor(store, day));
  const added = await store.sadd(seenKey(day), id);
  if (added === 1) {
    await store.expire(seenKey(day), KEEP_FOR);
    return store.incr(TOTAL_KEY);
  }
  return readViews(store);
}

export async function readViews(store: Pick<ViewsStore, "get">): Promise<number> {
  return Number((await store.get<number | string>(TOTAL_KEY)) ?? 0);
}
