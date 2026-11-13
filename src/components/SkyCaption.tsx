"use client";

import { createElement, useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  MapPin,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { placeTime, skyTime } from "@/lib/sky-clock";
import { setHeroSky, useHeroSky, type HeroSkyPref } from "@/lib/hero-sky-pref";
import { setSkyMode, useSkyMode, type SkyMode } from "@/lib/sky-mode";
import { site } from "@/lib/site";
import { useNow } from "@/lib/use-now";
import { useSkyWeather } from "@/lib/use-sky-weather";
import type { SkyWeather } from "@/lib/sky-weather";

const surface = "border border-foreground/10 bg-card/90 backdrop-blur-md";
const MODES: SkyMode[] = ["clock", "theme"];
const SKY: HeroSkyPref[] = ["on", "off"];

const pill =
  "tap-target whitespace-nowrap rounded-full px-3 py-1.5 text-muted pressable hover:text-foreground aria-pressed:bg-primary aria-pressed:text-background focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";

/** The icon for the weather in Pampanga right now, by day or night */
function weatherIcon(weather: SkyWeather | null, night: boolean): LucideIcon {
  if (weather?.label.includes("snow")) return CloudSnow;
  switch (weather?.kind) {
    case "partly":
      return night ? CloudMoon : CloudSun;
    case "overcast":
      return Cloud;
    case "fog":
      return CloudFog;
    case "drizzle":
      return CloudDrizzle;
    case "rain":
      return CloudRain;
    case "storm":
      return CloudLightning;
    default:
      return night ? Moon : Sun;
  }
}

/** Where each little cloud leaks out of the button, how far it drifts, its size and its delay */
const LEAKS: (CSSProperties & Record<`--${string}`, string>)[] = [
  { "--x": "86%", "--y": "25%", "--dx": "42px", "--dy": "-28px", "--s": "16px", "--d": "0s" },
  { "--x": "68%", "--y": "15%", "--dx": "18px", "--dy": "-36px", "--s": "12px", "--d": "0.65s" },
  { "--x": "92%", "--y": "50%", "--dx": "56px", "--dy": "-6px", "--s": "18px", "--d": "1.3s" },
  { "--x": "44%", "--y": "20%", "--dx": "6px", "--dy": "-32px", "--s": "11px", "--d": "1.95s" },
];

/** Set when the big button turns the sky on, so focus lands on the switch that replaced it */
let focusSkySwitch = false;

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The weather and time in San Fernando, Pampanga, as the hero's sky shows them */
function WeatherCard({ now }: { now: number | null }) {
  const weather = useSkyWeather();
  const { sky } = site;
  const night = now !== null && skyTime(now).night;
  const sunny = !night && (weather === null || weather.kind === "clear" || weather.kind === "partly");

  return (
    <section
      aria-label={sky.weather.label(sky.place)}
      className={`flex items-center gap-4 rounded-2xl py-3 pl-4 pr-5 ${surface}`}
    >
      {createElement(weatherIcon(weather, night), {
        "aria-hidden": true,
        strokeWidth: 1.5,
        className: `size-10 shrink-0 ${sunny ? "text-amber-500 dark:text-accent" : "text-foreground/70"}`,
      })}
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2.5">
          {weather && (
            <span className="text-3xl font-semibold leading-none tracking-tight tabular-nums">
              <span aria-hidden="true">{sky.weather.temperature(weather.temperature)}</span>
              <span className="sr-only">{sky.weather.temperatureLabel(weather.temperature)}</span>
            </span>
          )}
          <span className="text-sm text-foreground">
            {weather ? capitalise(weather.label) : sky.weather.unknown}
            {weather && <span className="text-muted"> · {sky.weather.wind(weather.wind)}</span>}
          </span>
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 font-mono text-xs text-muted">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <span>{sky.place}</span>
          <span aria-hidden="true">·</span>
          <time className="tabular-nums">{now === null ? "…" : placeTime(now)}</time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 text-primary">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
            {sky.weather.live}
          </span>
        </p>
      </div>
    </section>
  );
}

/** Under the hero: the weather card, the switches for the sky, and the credit for it */
export function SkyCaption() {
  const now = useNow(30_000);
  const mode = useSkyMode();
  const pref = useHeroSky();
  const { sky } = site;
  const onSwitch = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pref !== "on" || !focusSkySwitch) return;
    focusSkySwitch = false;
    onSwitch.current?.focus({ preventScroll: true });
  }, [pref]);

  // With the sky off (the default), one button turns it on
  if (pref === "off") {
    return (
      <div data-hero-fade className="sky-leak-host relative flex w-fit flex-col items-start gap-2">
        {/* Clouds and wind slip out from behind the button on hover (see globals.css) */}
        <span aria-hidden="true" className="sky-leak">
          {LEAKS.map((leak, i) => (
            <span key={i} className="sky-leak-puff" style={leak} />
          ))}
          <svg className="sky-leak-wind" viewBox="0 0 72 24">
            <path d="M0 9 C 18 6, 38 11, 70 4" />
            <path d="M4 16 C 24 19, 44 13, 66 18" />
          </svg>
        </span>
        <button
          type="button"
          title={sky.turnOnHint}
          onClick={() => {
            focusSkySwitch = true;
            setHeroSky("on");
          }}
          className={`group inline-flex items-center gap-2 rounded-full py-3 pl-4 pr-5 text-sm font-medium pressable hover:-translate-y-0.5 hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary relative ${surface}`}
        >
          <Cloud aria-hidden="true" className="size-4 text-primary transition-transform duration-(--duration-slow) group-hover:translate-x-0.5 group-hover:-translate-y-px" />
          {sky.turnOn}
        </button>
      </div>
    );
  }

  return (
    <div data-hero-fade className="flex flex-col items-start gap-2">
      <WeatherCard now={now} />
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-4 rounded-2xl px-3 py-1.5 font-mono sm:gap-y-1.5 text-xs ${surface}`}>
        <div role="group" aria-label={sky.switchLabel} className="flex items-center gap-1.5">
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
        <span aria-hidden="true" className="hidden h-4 w-px bg-foreground/15 sm:block" />
        <div role="group" aria-label={sky.skyLabel} className="flex items-center gap-1.5">
          <span className="text-muted">{sky.skyLabel}:</span>
          {SKY.map((s) => (
            <button
              key={s}
              ref={s === "on" ? onSwitch : undefined}
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
        className={`tap-target inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-primary ${surface}`}
      >
        {sky.caption}
        <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
      </Link>
    </div>
  );
}
