"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { placeTime } from "@/lib/sky-clock";
import { setHeroSky, useHeroSky, type HeroSkyPref } from "@/lib/hero-sky-pref";
import { setSkyMode, useSkyMode, type SkyMode } from "@/lib/sky-mode";
import { site } from "@/lib/site";
import { useNow } from "@/lib/use-now";
import { useSkyWeather } from "@/lib/use-sky-weather";
import { weatherText } from "@/lib/sky-weather";

const surface = "border border-foreground/10 bg-card/90 backdrop-blur-md";
const MODES: SkyMode[] = ["clock", "theme"];
const SKY: HeroSkyPref[] = ["on", "off"];

const pill =
  "whitespace-nowrap rounded-full px-2 py-0.5 text-muted transition-colors hover:text-foreground aria-pressed:bg-primary aria-pressed:text-background focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";

/** Under the hero: the time in Pampanga, the clock/theme switch, and the credit for the sky */
export function SkyCaption() {
  const now = useNow(30_000);
  const mode = useSkyMode();
  const weather = useSkyWeather();
  const pref = useHeroSky();
  const { sky } = site;

  // With the sky off, one short line keeps the way back
  if (pref === "off") {
    return (
      <div data-hero-fade className="flex flex-col items-start gap-2">
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl px-3 py-1.5 font-mono text-xs ${surface}`}>
          <p className="text-muted">{sky.off}</p>
          <button type="button" onClick={() => setHeroSky("on")} className={`${pill} text-primary`}>
            {sky.turnOn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-hero-fade className="flex flex-col items-start gap-2">
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl px-3 py-1.5 font-mono text-xs ${surface}`}>
        <p className="text-foreground">{sky.live(sky.place, now === null ? "…" : placeTime(now), weather ? weatherText(weather) : null)}</p>
        <div role="group" aria-label={sky.switchLabel} className="flex items-center gap-1">
          <span className="text-muted">{sky.switchLabel}:</span>
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={now !== null && mode === m}
              onClick={() => setSkyMode(m)}
              className={pill}
            >
              {sky.modes[m]}
            </button>
          ))}
        </div>
        <div role="group" aria-label={sky.skyLabel} className="flex items-center gap-1">
          <span className="text-muted">{sky.skyLabel}:</span>
          {SKY.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={pref === s}
              onClick={() => setHeroSky(s)}
              className={pill}
            >
              {sky.sky[s]}
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
