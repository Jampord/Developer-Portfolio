import { NextResponse } from "next/server";
import { Resend } from "resend";
import { checkWaitlistLimit, getClientIp } from "@/lib/rate-limit";
import { getRedis } from "@/lib/redis";
import { waitlistSchema } from "@/lib/waitlist-schema";

const WAITLIST_KEY = "deskcloud:waitlist";

/**
 * Deskcloud waitlist signup. Mirrors the contact route: parse → honeypot → validate →
 * rate limit → store. Always answers { ok: true } on success, so it never reveals
 * whether an address was already on the list.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot filled in: pretend it worked, store nothing
  if (typeof body === "object" && body !== null && "website" in body && (body as { website?: unknown }).website) {
    return NextResponse.json({ ok: true });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  }
  const { email } = parsed.data;

  const limit = await checkWaitlistLimit(getClientIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const redis = getRedis();
  if (!redis) {
    console.error("Waitlist is missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  // A set keeps each address once; SADD returns 1 only when it's new
  let added: number;
  try {
    added = await redis.sadd(WAITLIST_KEY, email);
  } catch (error) {
    console.error("Waitlist store error:", error);
    return NextResponse.json({ error: "Could not save" }, { status: 502 });
  }

  if (added === 1) await notifyOwner(email);

  return NextResponse.json({ ok: true });
}

/** Email me about a new signup. Failures are logged only: the address is already stored. */
async function notifyOwner(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("Waitlist notification skipped: RESEND_API_KEY or CONTACT_TO_EMAIL is missing");
    return;
  }

  try {
    // Created inside the handler so `next build` doesn't need the key
    const { error } = await new Resend(apiKey).emails.send({
      from: "Portfolio <onboarding@resend.dev>",
      to,
      subject: "Deskcloud waitlist: new signup",
      text: `New Deskcloud waitlist signup: ${email}`,
    });
    if (error) console.error("Resend error:", error);
  } catch (error) {
    console.error("Resend error:", error);
  }
}
