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
/** Turning it off flies you into a cloud. The sky is taken down once the cloud has closed over it… */
const COVER_MS = 680;
/** …and the cloud has thinned away by this point (see cloud-close in globals.css) */
const FLIGHT_MS = 1500;

let revealTimer: ReturnType<typeof setTimeout> | undefined;
let leaveTimer: ReturnType<typeof setTimeout> | undefined;
let clearTimer: ReturnType<typeof setTimeout> | undefined;
/** True while the sky has been turned off but the cloud has not closed over it yet */
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

/** The cloud has closed over the sky: take the sky down behind it. The cloud itself plays on. */
function takeDown() {
  leaving = false;
  document.documentElement.setAttribute(HERO_SKY_OFF_ATTR, "");
  announce();
}

/** Stop a flight into the cloud, wherever it has got to */
function endFlight() {
  clearTimeout(leaveTimer);
  clearTimeout(clearTimer);
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

    // You fly into a cloud first (CSS, only for visitors who allow motion); the sky comes down behind it
    if (allowsMotion()) {
      leaving = true;
      html.setAttribute(HERO_SKY_LEAVING_ATTR, "");
      leaveTimer = setTimeout(takeDown, COVER_MS);
      clearTimer = setTimeout(endFlight, FLIGHT_MS);
      return announce();
    }
    html.setAttribute(HERO_SKY_OFF_ATTR, "");
    return announce();
  }

  // Turned back on mid-flight: turn round and come back out of the cloud
  const midFlight = html.hasAttribute(HERO_SKY_LEAVING_ATTR);
  endFlight();

  // Turning it on plays the reveal (CSS, only for visitors who allow motion)
  if (wasOff || midFlight) {
    html.setAttribute(HERO_SKY_REVEAL_ATTR, "");
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

/** True if the sky is being revealed right now, i.e. a visitor has just turned it on */
export const isHeroSkyRevealing = () => document.documentElement.hasAttribute(HERO_SKY_REVEAL_ATTR);
