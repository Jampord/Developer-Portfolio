"use client";

import { useEffect, useRef, useState } from "react";
import { DeskcloudCanvas } from "@/features/deskcloud/components/DeskcloudCanvas";
import { useLiveSky } from "@/lib/use-live-sky";
import type { Rect } from "@/features/deskcloud/engine/types";
import {
  HERO_SKY_CLASS,
  HERO_SKY_FADE_CLASS,
  SKY_OBSTACLE_ATTR,
  SKY_OBSTACLES_EVENT,
  SKY_ORB_BLOCKER_ATTR,
} from "@/lib/hero-sky";
import { isHeroSkyRevealing, useHeroSkyLeaving } from "@/lib/hero-sky-pref";

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
  const [orbBlockers, setOrbBlockers] = useState<readonly Rect[]>([]);
  // Just switched on by a visitor: the sun or moon rises into place. Not on an ordinary page load.
  const [entrance] = useState(isHeroSkyRevealing);

  // Turned off: the clouds evaporate before the sky is taken down
  const leaving = useHeroSkyLeaving();

  // The real sky over Pampanga: colours, weather, moon phase, and where the sun or moon is
  const live = useLiveSky();

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
      const blockers = next.filter((_, i) => nodes[i].hasAttribute(SKY_ORB_BLOCKER_ATTR));
      setOrbBlockers((prev) => (sameRects(prev, blockers) ? prev : blockers));
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
    <div ref={root} aria-hidden="true" data-hero-sky-layer className={HERO_SKY_CLASS}>
      <DeskcloudCanvas
        obstacles={obstacles}
        orbTop={orbTop}
        palettes={live.palettes}
        moonPhase={live.moonPhase}
        theme={live.theme}
        weather={live.weather}
        orbArc={live.orbArc}
        orbBlockers={orbBlockers}
        entrance={entrance}
        present={!leaving}
        className="block h-full w-full"
      />
      <div className={HERO_SKY_FADE_CLASS} />
    </div>
  );
}
