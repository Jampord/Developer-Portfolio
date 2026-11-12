"use client";

import { useSyncExternalStore } from "react";
import { HERO_SKY_KEY, HERO_SKY_OFF_ATTR } from "./theme-script";

/** Whether the hero shows the live Deskcloud sky. Remembered per visitor; on by default. */
export type HeroSkyPref = "on" | "off";

const CHANGE_EVENT = "herosky:change";

function read(): HeroSkyPref {
  try {
    return localStorage.getItem(HERO_SKY_KEY) === "off" ? "off" : "on";
  } catch {
    return "on";
  }
}

export function setHeroSky(pref: HeroSkyPref) {
  try {
    localStorage.setItem(HERO_SKY_KEY, pref);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only
  }
  document.documentElement.toggleAttribute(HERO_SKY_OFF_ATTR, pref === "off");
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
