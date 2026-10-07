"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { contactSchema, type ContactValues } from "@/lib/contact-schema";
import { site } from "@/lib/site";

type Status = "idle" | "sending" | "sent" | "error" | "limited";

const field =
  "w-full rounded-2xl border border-foreground/15 bg-background px-4 py-3 outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values: ContactValues) {
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Request failed");
      if (res.status === 429) {
        setStatus("limited");
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <div>
        <label htmlFor="name" className="font-mono text-xs text-primary">
          {"//"} name
        </label>
        <input
          id="name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`${field} mt-2`}
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-500">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="font-mono text-xs text-primary">
          {"//"} email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={`${field} mt-2`}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="font-mono text-xs text-primary">
          {"//"} message
        </label>
        <textarea
          id="message"
          rows={6}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`${field} mt-2 resize-y`}
          {...register("message")}
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-sm text-red-500">
            {errors.message.message}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and screen readers */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center gap-2 justify-self-start rounded-full bg-primary px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
        <Send className="size-4" aria-hidden="true" />
      </button>

      <div aria-live="polite" className="min-h-6 text-sm">
        {status === "sent" && <p className="text-primary">Thanks! Your message is on its way. I&apos;ll reply soon.</p>}
        {status === "error" && (
          <p className="text-red-500">
            Something went wrong. Please email me directly at{" "}
            <a className="underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            .
          </p>
        )}
        {status === "limited" && (
          <p className="text-red-500">
            You&apos;ve sent a few messages in a short time. Please try again later, or email me directly at{" "}
            <a className="underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            .
          </p>
        )}
      </div>
    </form>
  );
}
