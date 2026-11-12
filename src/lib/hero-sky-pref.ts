"use client";

import { useSyncExternalStore } from "react";
import { HERO_SKY_KEY, HERO_SKY_OFF_ATTR, HERO_SKY_REVEAL_ATTR } from "./theme-script";

/** Whether the hero shows the live Deskcloud sky. Remembered per visitor; off until they turn it on. */
export type HeroSkyPref = "on" | "off";

const CHANGE_EVENT = "herosky:change";

/** Long enough for the sky and the last icon to finish appearing (see globals.css) */
const REVEAL_MS = 2500;
let revealTimer: ReturnType<typeof setTimeout> | undefined;

function read(): HeroSkyPref {
  try {
    return localStorage.getItem(HERO_SKY_KEY) === "on" ? "on" : "off";
  } catch {
    return "off";
  }
}

export function setHeroSky(pref: HeroSkyPref) {
  try {
    localStorage.setItem(HERO_SKY_KEY, pref);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only
  }
  const html = document.documentElement;
  // Turning it on plays the reveal (CSS, only for visitors who allow motion)
  if (pref === "on" && html.hasAttribute(HERO_SKY_OFF_ATTR)) {
    html.setAttribute(HERO_SKY_REVEAL_ATTR, "");
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => html.removeAttribute(HERO_SKY_REVEAL_ATTR), REVEAL_MS);
  } else if (pref === "off") {
    html.removeAttribute(HERO_SKY_REVEAL_ATTR);
  }
  html.toggleAttribute(HERO_SKY_OFF_ATTR, pref === "off");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === HERO_SKY_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The visitor's choice, or null while server rendering and hydrating (when it isn't known yet) */
export function useHeroSky(): HeroSkyPref | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
