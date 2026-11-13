"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

/** Set on the owner's own devices (visit /?me once; /?me=off undoes it) so their visits don't count */
const SKIP_KEY = "views-skip";
/** How long the count-up takes, in ms, and where it starts as a share of the real number */
const COUNT_MS = 800;
const COUNT_FROM = 0.85;

const format = (n: number) => n.toLocaleString("en-US");
const startOf = (views: number) => Math.floor(views * COUNT_FROM);
/** Only called once there's a number, which only happens in the browser */
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Remember (or forget) that this device is the owner's, from the ?me query */
function ownerSkips(): boolean {
  try {
    const me = new URLSearchParams(location.search).get("me");
    if (me === "off") localStorage.removeItem(SKIP_KEY);
    else if (me !== null) localStorage.setItem(SKIP_KEY, "1");
    return localStorage.getItem(SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * "1,234 profile views" in the footer. The visit is counted once per page load (the server
 * keeps it to once a day per visitor), and the number counts up when it scrolls into view.
 * Nothing shows while the total is under the threshold, or if it can't be fetched.
 */
export function ProfileViews() {
  const [views, setViews] = useState<number | null>(null);
  const [shown, setShown] = useState<number | null>(null);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/views", { method: ownerSkips() ? "GET" : "POST" })
      .then((res) => (res.ok ? res.json() : { views: null }))
      .then((data: { views: number | null }) => {
        if (live && typeof data.views === "number") setViews(data.views);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (views === null || !el || reducedMotion()) return;

    const from = startOf(views);
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / COUNT_MS);
        const eased = 1 - (1 - t) ** 3;
        setShown(Math.round(from + (views - from) * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [views]);

  if (views === null) return null;
  // Until it scrolls into view it waits at its starting point; with reduced motion it's just the number
  const display = shown ?? (reducedMotion() ? views : startOf(views));
  return (
    <p ref={ref} className="tabular-nums">
      <span aria-hidden="true" className="mr-3">
        ·
      </span>
      {/* Screen readers get the final number once, not every step of the count */}
      <span aria-hidden="true">{format(display)}</span>
      <span className="sr-only">{format(views)}</span> {site.views.label}
    </p>
  );
}
