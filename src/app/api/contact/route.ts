import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema } from "@/lib/contact-schema";
import { checkContactLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot filled in: pretend it worked, send nothing
  if (typeof body === "object" && body !== null && "website" in body && (body as { website?: unknown }).website) {
    return NextResponse.json({ ok: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  }
  const data = parsed.data;

  const limit = await checkContactLimit(getClientIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("Contact form is missing RESEND_API_KEY or CONTACT_TO_EMAIL");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  // Created inside the handler so `next build` doesn't need the key
  const resend = new Resend(apiKey);
  const safeName = data.name.replace(/[\r\n]+/g, " ");

  const { error } = await resend.emails.send({
    from: "Portfolio <onboarding@resend.dev>",
    to,
    replyTo: data.email,
    subject: `Portfolio message from ${safeName}`,
    text: `Name: ${safeName}\nEmail: ${data.email}\n\n${data.message}`,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Could not send" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
