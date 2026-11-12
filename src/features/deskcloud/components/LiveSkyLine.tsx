"use client";

import { placeTime } from "@/lib/sky-clock";
import { weatherText } from "@/lib/sky-weather";
import { useNow } from "@/lib/use-now";
import { useSkyWeather } from "@/lib/use-sky-weather";
import { en } from "../content/en";

/** Under the demo: whose sky it is, so a sunny demo at someone else's midnight doesn't look broken */
export function LiveSkyLine() {
  const now = useNow(30_000);
  const weather = useSkyWeather();
  return (
    <p className="mt-3 font-mono text-xs text-muted">
      {en.demo.liveSky(now === null ? "…" : placeTime(now), weather ? weatherText(weather) : null)}
    </p>
  );
}
