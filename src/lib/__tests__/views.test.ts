import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOTAL_KEY, VIEWS_THRESHOLD, dayOf, isBot, recordView, shownViews, visitorId, type ViewsStore } from "../views";

/** An in-memory stand-in for the Redis commands the counter uses */
function memoryStore() {
  const values = new Map<string, unknown>();
  const sets = new Map<string, Set<string>>();
  const store: ViewsStore = {
    async get<T>(key: string) {
      return (values.get(key) as T | undefined) ?? null;
    },
    async set(key, value, { nx }) {
      if (nx && values.has(key)) return null;
      values.set(key, value);
      return "OK";
    },
    async sadd(key, member) {
      const set = sets.get(key) ?? new Set();
      sets.set(key, set);
      if (set.has(member)) return 0;
      set.add(member);
      return 1;
    },
    async expire() {
      return 1;
    },
    async incr(key) {
      const next = Number(values.get(key) ?? 0) + 1;
      values.set(key, next);
      return next;
    },
  };
  return { store, values, sets };
}

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const day1 = new Date("2026-11-13T09:00:00Z");
const day2 = new Date("2026-11-14T09:00:00Z");

describe("isBot", () => {
  it("lets browsers through", () => {
    expect(isBot(CHROME)).toBe(false);
  });
  it.each(["Googlebot/2.1", "facebookexternalhit/1.1", "Mozilla/5.0 HeadlessChrome/131", "curl/8.4", "Chrome-Lighthouse", null])(
    "stops %s",
    (ua) => {
      expect(isBot(ua)).toBe(true);
    },
  );
});

describe("visitorId", () => {
  it("is the same for one visitor on one day, and changes with the day or the salt", () => {
    const a = visitorId("203.0.113.7", CHROME, "2026-11-13", "salt");
    expect(visitorId("203.0.113.7", CHROME, "2026-11-13", "salt")).toBe(a);
    expect(visitorId("203.0.113.7", CHROME, "2026-11-14", "salt")).not.toBe(a);
    expect(visitorId("203.0.113.7", CHROME, "2026-11-13", "other")).not.toBe(a);
  });
  it("never contains the IP", () => {
    expect(visitorId("203.0.113.7", CHROME, "2026-11-13", "salt")).not.toContain("203.0.113.7");
  });
});

describe("shownViews", () => {
  it("hides the count until the threshold", () => {
    expect(shownViews(null)).toBeNull();
    expect(shownViews(VIEWS_THRESHOLD - 1)).toBeNull();
    expect(shownViews(VIEWS_THRESHOLD)).toBe(VIEWS_THRESHOLD);
  });
});

describe("recordView", () => {
  it("counts a visitor once a day", async () => {
    const { store } = memoryStore();
    const visit = { ip: "203.0.113.7", userAgent: CHROME };
    expect(await recordView(store, { ...visit, now: day1 })).toBe(1);
    expect(await recordView(store, { ...visit, now: day1 })).toBe(1);
    expect(await recordView(store, { ...visit, now: day2 })).toBe(2);
  });

  it("counts different visitors on the same day", async () => {
    const { store } = memoryStore();
    await recordView(store, { ip: "203.0.113.7", userAgent: CHROME, now: day1 });
    expect(await recordView(store, { ip: "198.51.100.4", userAgent: CHROME, now: day1 })).toBe(2);
  });

  it("stores no IP anywhere", async () => {
    const { store, values, sets } = memoryStore();
    await recordView(store, { ip: "203.0.113.7", userAgent: CHROME, now: day1 });
    const everything = JSON.stringify([...values.entries(), ...[...sets.entries()].map(([k, s]) => [k, [...s]])]);
    expect(everything).not.toContain("203.0.113.7");
    expect(values.get(TOTAL_KEY)).toBe(1);
  });

  it("keeps one salt per day", async () => {
    const { store, values } = memoryStore();
    await recordView(store, { ip: "a", userAgent: CHROME, now: day1 });
    const salt = values.get(`portfolio:views:salt:${dayOf(day1)}`);
    await recordView(store, { ip: "b", userAgent: CHROME, now: day1 });
    expect(values.get(`portfolio:views:salt:${dayOf(day1)}`)).toBe(salt);
  });
});

// ---- The route, with Redis mocked ----
const getRedis = vi.fn();
vi.mock("@/lib/redis", () => ({ getRedis: () => getRedis() }));

const { GET, POST } = await import("@/app/api/views/route");

const post = (ua: string | null = CHROME) =>
  POST(new Request("http://localhost/api/views", { method: "POST", headers: ua ? { "user-agent": ua, "x-real-ip": "203.0.113.7" } : {} }));

describe("/api/views", () => {
  let mem: ReturnType<typeof memoryStore>;
  beforeEach(() => {
    mem = memoryStore();
    getRedis.mockReturnValue(mem.store);
    vi.stubEnv("VERCEL_ENV", "production");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("counts a person on the live site, but shows nothing under the threshold", async () => {
    const res = await post();
    expect(await res.json()).toEqual({ views: null });
    expect(mem.values.get(TOTAL_KEY)).toBe(1);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("shows the total once it reaches the threshold", async () => {
    mem.values.set(TOTAL_KEY, VIEWS_THRESHOLD);
    expect(await (await post()).json()).toEqual({ views: VIEWS_THRESHOLD + 1 });
  });

  it("doesn't count bots", async () => {
    mem.values.set(TOTAL_KEY, 150);
    expect(await (await post("Googlebot/2.1")).json()).toEqual({ views: 150 });
    expect(mem.values.get(TOTAL_KEY)).toBe(150);
  });

  it("doesn't count on previews or locally", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    mem.values.set(TOTAL_KEY, 150);
    expect(await (await post()).json()).toEqual({ views: 150 });
    expect(mem.values.get(TOTAL_KEY)).toBe(150);
  });

  it("reads without counting", async () => {
    mem.values.set(TOTAL_KEY, 150);
    expect(await (await GET()).json()).toEqual({ views: 150 });
    expect(mem.values.get(TOTAL_KEY)).toBe(150);
  });

  it("hides the count when Redis is missing or failing", async () => {
    getRedis.mockReturnValue(null);
    expect(await (await post()).json()).toEqual({ views: null });

    getRedis.mockReturnValue({ ...mem.store, sadd: () => Promise.reject(new Error("down")) });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await (await post()).json()).toEqual({ views: null });
  });
});
