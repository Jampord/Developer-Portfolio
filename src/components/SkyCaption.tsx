"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { placeTime } from "@/lib/sky-clock";
import { setSkyMode, useSkyMode, type SkyMode } from "@/lib/sky-mode";
import { site } from "@/lib/site";
import { useNow } from "@/lib/use-now";

const surface = "border border-foreground/10 bg-card/90 backdrop-blur-md";
const MODES: SkyMode[] = ["clock", "theme"];

/** Under the hero: the time in Pampanga, the clock/theme switch, and the credit for the sky */
export function SkyCaption() {
  const now = useNow(30_000);
  const mode = useSkyMode();
  const { sky } = site;

  return (
    <div data-hero-fade className="flex flex-col items-start gap-2">
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl px-3 py-1.5 font-mono text-xs ${surface}`}>
        <p className="text-foreground">{sky.live(sky.place, now === null ? "…" : placeTime(now))}</p>
        <div role="group" aria-label={sky.switchLabel} className="flex items-center gap-1">
          <span className="text-muted">{sky.switchLabel}:</span>
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={now !== null && mode === m}
              onClick={() => setSkyMode(m)}
              className="whitespace-nowrap rounded-full px-2 py-0.5 text-muted transition-colors hover:text-foreground aria-pressed:bg-primary aria-pressed:text-background focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            >
              {sky.modes[m]}
            </button>
          ))}
        </div>
      </div>
      <Link
        href={sky.href}
        className={`inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-primary ${surface}`}
      >
        {sky.caption}
        <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
      </Link>
    </div>
  );
}
