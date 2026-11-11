"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { waitlistSchema, type WaitlistInput, type WaitlistValues } from "@/lib/waitlist-schema";
import { en } from "../content/en";

type Status = "idle" | "sending" | "done" | "error" | "limited";

const t = en.waitlist;

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WaitlistInput, unknown, WaitlistValues>({ resolver: zodResolver(waitlistSchema) });

  async function onSubmit(values: WaitlistValues) {
    setStatus("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      // Check the rate limit before the generic failure, so visitors get the right message
      if (res.status === 429) {
        setStatus("limited");
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      reset();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative grid gap-3">
      <label htmlFor="waitlist-email" className="font-mono text-xs text-primary">
        {t.form.emailLabel}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t.form.placeholder}
          aria-invalid={!!errors.email}
          aria-describedby={`waitlist-privacy${errors.email ? " waitlist-email-error" : ""}`}
          className="min-w-0 flex-1 rounded-full border border-foreground/15 bg-background px-5 py-3 outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          {...register("email")}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        >
          {status === "sending" ? t.form.sending : t.form.submit}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      {errors.email && (
        <p id="waitlist-email-error" className="text-sm text-red-500">
          {errors.email.message}
        </p>
      )}

      {/* Honeypot: hidden from people and screen readers */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="waitlist-website">{t.form.honeypotLabel}</label>
        <input id="waitlist-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <p id="waitlist-privacy" className="text-sm text-muted">
        {t.privacy}
      </p>

      <div aria-live="polite" className="min-h-6 text-sm">
        {status === "done" && <p className="text-primary">{t.status.done}</p>}
        {status === "error" && <p className="text-red-500">{t.status.error}</p>}
        {status === "limited" && <p className="text-red-500">{t.status.limited}</p>}
      </div>
    </form>
  );
}
