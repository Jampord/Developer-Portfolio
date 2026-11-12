"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DeskcloudCanvas } from "@/features/deskcloud/components/DeskcloudCanvas";
import { lerpPalette } from "@/features/deskcloud/engine/renderer";
import { sky } from "@/features/deskcloud/themes/sky";
import { dawn, golden, overcastDay, overcastNight } from "@/features/deskcloud/themes/skyTints";
import { withCloudCover } from "@/features/deskcloud/themes/weather";
import { FALLBACK_EFFECT, WEATHER_EFFECTS } from "@/lib/sky-weather";
import { useSkyWeather } from "@/lib/use-sky-weather";
import { moonPhase, skyTime } from "@/lib/sky-clock";
import { useNow } from "@/lib/use-now";
import type { Rect } from "@/features/deskcloud/engine/types";
import { HERO_SKY_CLASS, HERO_SKY_FADE_CLASS, SKY_OBSTACLE_ATTR, SKY_OBSTACLES_EVENT } from "@/lib/hero-sky";

/** Space between the navbar and the top of the sun or moon, in px */
const ORB_GAP = 16;

const sameRects =(a: readonly Rect[], b: readonly Rect[]) =>
  a.length === b.length &&
  a.every((r, i) => r.x === b[i].x && r.y === b[i].y && r.width === b[i].width && r.height === b[i].height);

/**
 * The Deskcloud sky behind the hero. It knows nothing about the hero's content: it measures
 * every element marked as an obstacle in its section and hands those boxes to the engine.
 */
export function HeroSky() {
  const root = useRef<HTMLDivElement>(null);
  const [obstacles, setObstacles] = useState<readonly Rect[]>([]);
  const [orbTop, setOrbTop] = useState(0);

  // The real sky over Pampanga: dawn and golden-hour tints by day, the moon's phase by night,
  // and the current weather (partly cloudy until it arrives, or if it can't be fetched)
  const now = useNow(60_000);
  const weather = useSkyWeather();
  const effect = weather ? WEATHER_EFFECTS[weather.kind] : FALLBACK_EFFECT;
  const theme = useMemo(() => withCloudCover(sky, effect), [effect]);
  const palettes = useMemo(() => {
    if (now === null) return null;
    const { dawn: d, golden: g } = skyTime(now);
    const day = lerpPalette(lerpPalette(sky.palettes.day, dawn, d), golden, g);
    return {
      day: lerpPalette(day, overcastDay, effect.grey),
      night: lerpPalette(sky.palettes.night, overcastNight, effect.grey),
    };
  }, [now, effect]);
  const phase = now === null ? null : moonPhase(now);

  useEffect(() => {
    const el = root.current;
    const section = el?.closest("section");
    if (!el || !section) return;

    const nodes = [...section.querySelectorAll<HTMLElement>(`[${SKY_OBSTACLE_ATTR}]`)];
    let frame = 0;

    const measure = () => {
      frame = 0;
      const origin = el.getBoundingClientRect();
      const next = nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return {
          x: Math.round(r.left - origin.left),
          y: Math.round(r.top - origin.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
        };
      });
      setObstacles((prev) => (sameRects(prev, next) ? prev : next));
      // The canvas runs up behind the navbar; the hero (and the open sky) starts where the section does
      setOrbTop(Math.round(section.getBoundingClientRect().top - origin.top) + ORB_GAP);
    };
    // At most one measurement, and one obstacle update for the clouds, per frame
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    // Layout changes: the hero resizing, or the headline reflowing when its font arrives
    const resize = new ResizeObserver(schedule);
    resize.observe(el);
    nodes.forEach((node) => resize.observe(node));
    // Moves that don't change any size: a dragged icon, and the end of the intro animations
    section.addEventListener(SKY_OBSTACLES_EVENT, schedule);
    section.addEventListener("animationend", schedule);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      section.removeEventListener(SKY_OBSTACLES_EVENT, schedule);
      section.removeEventListener("animationend", schedule);
    };
  }, []);

  return (
    <div ref={root} aria-hidden="true" className={HERO_SKY_CLASS}>
      <DeskcloudCanvas
        obstacles={obstacles}
        orbTop={orbTop}
        palettes={palettes}
        moonPhase={phase}
        theme={theme}
        weather={effect}
        className="block h-full w-full"
      />
      <div className={HERO_SKY_FADE_CLASS} />
    </div>
  );
}
