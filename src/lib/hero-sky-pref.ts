"use client";

import { useSyncExternalStore } from "react";
import {
  HERO_SKY_KEY,
  HERO_SKY_LEAVING_ATTR,
  HERO_SKY_OFF_ATTR,
  HERO_SKY_REVEAL_ATTR,
  HERO_SKY_TOGGLED_ATTR,
} from "./theme-script";

/** Whether the hero shows the live Deskcloud sky. Remembered per visitor; off until they turn it on. */
export type HeroSkyPref = "on" | "off";

const CHANGE_EVENT = "herosky:change";

/** Long enough for the sky and the last icon to finish appearing (see globals.css) */
const REVEAL_MS = 2500;
/**
 * Turning it off: the clouds evaporate (in the engine, about 0.9 s) and the sky's colour fades
 * after them (sky-leave in globals.css); then the sky is taken down. With reduced motion it is a
 * short cross-fade instead.
 */
const LEAVE_MS = 1100;
const LEAVE_REDUCED_MS = 200;

let revealTimer: ReturnType<typeof setTimeout> | undefined;
let leaveTimer: ReturnType<typeof setTimeout> | undefined;
/** True while the sky has been turned off but is still fading away */
let leaving = false;

/** What the visitor chose, the moment they chose it */
function readChoice(): HeroSkyPref {
  try {
    return localStorage.getItem(HERO_SKY_KEY) === "on" ? "on" : "off";
  } catch {
    return "off";
  }
}

/** What is on the page: the same, except that a sky on its way out still counts as on */
function readShown(): HeroSkyPref {
  return leaving ? "on" : readChoice();
}

const allowsMotion = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function announce() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** The clouds and the sky's colour have faded: take the sky down */
function takeDown() {
  const html = document.documentElement;
  leaving = false;
  html.setAttribute(HERO_SKY_OFF_ATTR, "");
  html.removeAttribute(HERO_SKY_LEAVING_ATTR);
  announce();
}

/** Stop the sky fading away, wherever it has got to */
function stopLeaving() {
  clearTimeout(leaveTimer);
  leaving = false;
  document.documentElement.removeAttribute(HERO_SKY_LEAVING_ATTR);
}

export function setHeroSky(pref: HeroSkyPref) {
  const html = document.documentElement;
  const wasOff = html.hasAttribute(HERO_SKY_OFF_ATTR);

  try {
    localStorage.setItem(HERO_SKY_KEY, pref);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only
  }
  // From now on, whatever replaces the switch appears at once instead of waiting its turn in the intro
  html.setAttribute(HERO_SKY_TOGGLED_ATTR, "");

  if (pref === "off") {
    html.removeAttribute(HERO_SKY_REVEAL_ATTR);
    clearTimeout(revealTimer);
    if (wasOff || leaving) return announce();

    // The clouds evaporate and the sky fades; it is taken down once they have gone
    leaving = true;
    html.setAttribute(HERO_SKY_LEAVING_ATTR, "");
    leaveTimer = setTimeout(takeDown, allowsMotion() ? LEAVE_MS : LEAVE_REDUCED_MS);
    return announce();
  }

  // Turned back on while it was fading: the clouds condense again from where they had got to
  const returning = leaving;
  stopLeaving();

  // Turning it on plays the reveal (see globals.css). Coming back mid-fade, the sky's colour is
  // still partly there, so only the icons replay.
  if (wasOff || returning) {
    html.setAttribute(HERO_SKY_REVEAL_ATTR, returning ? "return" : "fresh");
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => html.removeAttribute(HERO_SKY_REVEAL_ATTR), REVEAL_MS);
  }
  html.removeAttribute(HERO_SKY_OFF_ATTR);
  announce();
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

/**
 * Whether the sky is on the page, or null while server rendering and hydrating (when it isn't
 * known yet). It stays "on" for the moment the sky takes to fade out.
 */
export function useHeroSky(): HeroSkyPref | null {
  return useSyncExternalStore(subscribe, readShown, () => null);
}

/** What the visitor chose, with no wait: for the switch itself, so a press shows at once */
export function useHeroSkyChoice(): HeroSkyPref | null {
  return useSyncExternalStore(subscribe, readChoice, () => null);
}

/** True while the sky has been turned off and its clouds are evaporating */
export function useHeroSkyLeaving(): boolean {
  return useSyncExternalStore(subscribe, () => leaving, () => false);
}

/** True if the sky is being revealed right now, i.e. a visitor has just turned it on */
export const isHeroSkyRevealing = () => document.documentElement.hasAttribute(HERO_SKY_REVEAL_ATTR);
