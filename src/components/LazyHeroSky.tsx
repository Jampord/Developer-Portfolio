"use client";

import dynamic from "next/dynamic";
import { skyBackgroundClass, skyBackgroundStyle } from "@/features/deskcloud/components/demoFrame";
import { HERO_SKY_CLASS, HERO_SKY_FADE_CLASS } from "@/lib/hero-sky";

/** The sky's gradient in the same box, so the hero looks right from the first paint */
function SkyPlaceholder() {
  return (
    <div aria-hidden="true" className={`${HERO_SKY_CLASS} ${skyBackgroundClass}`} style={skyBackgroundStyle}>
      <div className={HERO_SKY_FADE_CLASS} />
    </div>
  );
}

/** The engine and canvas load in their own chunk on the client, after the headline */
export const LazyHeroSky = dynamic(() => import("./HeroSky").then((m) => m.HeroSky), {
  ssr: false,
  loading: SkyPlaceholder,
});
