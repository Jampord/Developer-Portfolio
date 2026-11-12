"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { lerpPalette } from "@/features/deskcloud/engine/renderer";
import { sky } from "@/features/deskcloud/themes/sky";
import { dawn, golden, overcastDay, overcastNight, stormDay, stormNight } from "@/features/deskcloud/themes/skyTints";
import { withCloudCover } from "@/features/deskcloud/themes/weather";
import { moonArc, moonPhase, skyTime, sunArc, type SkyArc } from "./sky-clock";
import { weatherEffect } from "./sky-weather";
import { useNow } from "./use-now";
import { useSkyWeather } from "./use-sky-weather";

/**
 * Everything the canvas needs to draw the real sky over San Fernando, Pampanga: dawn and
 * golden-hour colours, the weather (partly cloudy until it arrives, or if it can't be fetched),
 * the moon's phase, and where the sun or moon is on its arc. Shared by the hero and the demo.
 */
export function useLiveSky() {
  const now = useNow(60_000);
  const weather = useSkyWeather();
  const { resolvedTheme } = useTheme();
  const effect = useMemo(() => weatherEffect(weather), [weather]);
  const theme = useMemo(() => withCloudCover(sky, effect), [effect]);

  const palettes = useMemo(() => {
    if (now === null) return null;
    const { dawn: d, golden: g } = skyTime(now);
    const day = lerpPalette(lerpPalette(sky.palettes.day, dawn, d), golden, g);
    return {
      day: lerpPalette(lerpPalette(day, overcastDay, effect.grey), stormDay, effect.dark),
      night: lerpPalette(lerpPalette(sky.palettes.night, overcastNight, effect.grey), stormNight, effect.dark),
    };
  }, [now, effect]);

  // The real sun or moon only when the site's theme agrees with the clock in Pampanga (always, in
  // clock mode). If a visitor picked dark at Pampanga noon, the moon goes back to the roomiest open sky.
  let arc: SkyArc | null = null;
  if (now !== null && resolvedTheme) {
    const night = skyTime(now).night;
    if (night === (resolvedTheme === "dark")) arc = night ? moonArc(now) : sunArc(now);
  }
  // A new object each minute would restart the ease; keep it stable while the value is the same
  const arcKey = arc === null ? "none" : arc === "below" ? "below" : arc.progress.toFixed(4);
  const orbArc = useMemo(
    () => (arcKey === "none" ? null : arcKey === "below" ? ("below" as const) : { progress: Number(arcKey) }),
    [arcKey],
  );

  return {
    palettes,
    moonPhase: now === null ? null : moonPhase(now),
    theme,
    weather: effect,
    orbArc,
  };
}
