"use client";

import { useEffect, useState, type ComponentType } from "react";
import { skyBackgroundClass, skyBackgroundStyle } from "@/features/deskcloud/components/demoFrame";
import { useHeroSky } from "@/lib/hero-sky-pref";
import { HERO_SKY_CLASS, HERO_SKY_FADE_CLASS } from "@/lib/hero-sky";

/** The sky's gradient in the same box, so the hero looks right from the first paint */
function SkyPlaceholder() {
  return (
    <div
      aria-hidden="true"
      data-hero-sky-layer
      className={`${HERO_SKY_CLASS} ${skyBackgroundClass}`}
      style={skyBackgroundStyle}
    >
      <div className={HERO_SKY_FADE_CLASS} />
    </div>
  );
}

/** Kept after the first load, so turning the sky back on doesn't fetch it again */
let loadedSky: ComponentType | null = null;

/**
 * The hero's background. Until the visitor's choice is known it shows the placeholder, which CSS
 * hides at once if they turned the sky off. The engine and canvas are fetched in their own chunk,
 * only once the sky is known to be on, so with the sky off they're never downloaded.
 */
export function HeroSkyLayer() {
  const pref = useHeroSky();
  const [Sky, setSky] = useState<ComponentType | null>(() => loadedSky);

  useEffect(() => {
    if (pref !== "on" || Sky) return;
    let live = true;
    void import("./HeroSky").then((m) => {
      loadedSky = m.HeroSky;
      if (live) setSky(() => m.HeroSky);
    });
    return () => {
      live = false;
    };
  }, [pref, Sky]);

  if (pref === "off") return null;
  if (pref === null || !Sky) return <SkyPlaceholder />;
  return <Sky />;
}
