"use client";

import { useSyncExternalStore } from "react";
import { describeWeather, type SkyWeather } from "./sky-weather";

/** Matches the route's cache, so a long visit picks up new weather */
const REFRESH_EVERY = 30 * 60_000;

let weather: SkyWeather | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

/** In development, ?weather=<WMO code> previews a weather without waiting for it (e.g. ?weather=63 for rain) */
function previewWeather(): SkyWeather | null {
  if (process.env.NODE_ENV === "production") return null;
  const code = new URLSearchParams(window.location.search).get("weather");
  return code === null ? null : describeWeather(Number(code), 28);
}

async function load() {
  const preview = previewWeather();
  if (preview) {
    weather = preview;
    listeners.forEach((l) => l());
    return;
  }
  try {
    const res = await fetch("/api/sky-weather");
    const body = (await res.json()) as { weather: SkyWeather | null };
    weather = res.ok ? body.weather : null;
  } catch {
    weather = null;
  }
  listeners.forEach((l) => l());
}

/** One fetch shared by the sky and the caption, started by whichever subscribes first */
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (!timer) {
    void load();
    timer = setInterval(load, REFRESH_EVERY);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** The weather over Pampanga, or null until it arrives (or if it can't be fetched) */
export function useSkyWeather(): SkyWeather | null {
  return useSyncExternalStore(
    subscribe,
    () => weather,
    () => null,
  );
}
