import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import { getRedis } from "@/lib/redis";
import { isBot, readViews, recordView, shownViews } from "@/lib/views";

/** Never cached: each answer is this moment's total */
const headers = { "Cache-Control": "no-store" };

/** Only the live site counts; local dev and preview deployments just read */
const counts = () => process.env.VERCEL_ENV === "production";

/** The site's profile views, or null while under the threshold (or if they can't be read) */
export async function GET() {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ views: null }, { headers });
  try {
    return NextResponse.json({ views: shownViews(await readViews(redis)) }, { headers });
  } catch (error) {
    console.error("Views read error:", error);
    return NextResponse.json({ views: null }, { headers });
  }
}

/** A page load: counts the visitor once a day (people only, live site only) and returns the total */
export async function POST(req: Request) {
  const userAgent = req.headers.get("user-agent");
  if (!counts() || isBot(userAgent)) return GET();

  const redis = getRedis();
  if (!redis) return NextResponse.json({ views: null }, { headers });
  try {
    const total = await recordView(redis, { ip: getClientIp(req), userAgent: userAgent ?? "", now: new Date() });
    return NextResponse.json({ views: shownViews(total) }, { headers });
  } catch (error) {
    // A counter outage should never show on the page: it just hides
    console.error("Views store error:", error);
    return NextResponse.json({ views: null }, { headers });
  }
}
