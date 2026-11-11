import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitlistSchema } from "../waitlist-schema";

// ---- Mocks for the route: Redis, the rate limiter and Resend ----
const sadd = vi.fn();
const getRedis = vi.fn();
const checkWaitlistLimit = vi.fn();
const send = vi.fn();

vi.mock("@/lib/redis", () => ({ getRedis: () => getRedis() }));
vi.mock("@/lib/rate-limit", () => ({
  checkWaitlistLimit: (ip: string) => checkWaitlistLimit(ip),
  getClientIp: () => "203.0.113.7",
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => send(...args) };
  },
}));

const { POST } = await import("@/app/api/waitlist/route");

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

describe("waitlistSchema", () => {
  it("trims and lowercases the email", () => {
    expect(waitlistSchema.parse({ email: "  Ada@Example.COM " }).email).toBe("ada@example.com");
  });

  it("rejects invalid and overly long emails", () => {
    expect(waitlistSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(waitlistSchema.safeParse({ email: `${"a".repeat(115)}@x.com` }).success).toBe(false);
    expect(waitlistSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it("allows the honeypot field", () => {
    expect(waitlistSchema.safeParse({ email: "a@b.co", website: "" }).success).toBe(true);
  });
});

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    getRedis.mockReturnValue({ sadd });
    checkWaitlistLimit.mockResolvedValue({ ok: true });
    sadd.mockResolvedValue(1);
    send.mockResolvedValue({ error: null });
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_TO_EMAIL = "owner@example.com";
  });

  it("rejects a body that isn't JSON", async () => {
    expect((await post("{nope")).status).toBe(400);
  });

  it("pretends a honeypot hit worked and stores nothing", async () => {
    const res = await post({ email: "bot@example.com", website: "http://spam" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sadd).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("returns 422 for an invalid email", async () => {
    expect((await post({ email: "nope" })).status).toBe(422);
    expect(sadd).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when rate limited", async () => {
    checkWaitlistLimit.mockResolvedValue({ ok: false, retryAfter: 42 });
    const res = await post({ email: "a@b.co" });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(sadd).not.toHaveBeenCalled();
  });

  it("returns 500 when Redis isn't configured", async () => {
    getRedis.mockReturnValue(null);
    const res = await post({ email: "a@b.co" });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Server not configured" });
  });

  it("stores a new email (normalised) and notifies the owner once", async () => {
    const res = await post({ email: "  New@Example.com " });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sadd).toHaveBeenCalledWith("deskcloud:waitlist", "new@example.com");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({
      to: "owner@example.com",
      subject: "Deskcloud waitlist: new signup",
    });
  });

  it("returns ok for a duplicate without a second email", async () => {
    sadd.mockResolvedValue(0);
    const res = await post({ email: "a@b.co" });
    expect(await res.json()).toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  it("still succeeds when the notification fails, since the email is stored", async () => {
    send.mockResolvedValue({ error: { message: "boom" } });
    const res = await post({ email: "a@b.co" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("still succeeds when Resend isn't configured", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await post({ email: "a@b.co" });
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns 502 when the email can't be stored", async () => {
    sadd.mockRejectedValue(new Error("redis down"));
    const res = await post({ email: "a@b.co" });
    expect(res.status).toBe(502);
    expect(send).not.toHaveBeenCalled();
  });
});
