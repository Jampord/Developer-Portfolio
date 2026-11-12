"use client";

import { useSyncExternalStore } from "react";
import { skyTime } from "./sky-clock";
import { SKY_MODE_KEY } from "./theme-script";

export { SKY_MODE_KEY };

/**
 * Whether the site's light/dark follows the real clock in Pampanga (the default) or the
 * visitor's own choice. Remembered per visitor, like the theme itself.
 */
export type SkyMode = "clock" | "theme";

const CHANGE_EVENT = "skymode:change";

export function readSkyMode(): SkyMode {
  try {
    return localStorage.getItem(SKY_MODE_KEY) === "theme" ? "theme" : "clock";
  } catch {
    return "clock";
  }
}

export function setSkyMode(mode: SkyMode) {
  try {
    localStorage.setItem(SKY_MODE_KEY, mode);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === SKY_MODE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSkyMode(): SkyMode {
  return useSyncExternalStore(subscribe, readSkyMode, () => "clock");
}

/** The theme the clock asks for right now */
export const clockTheme = (ms = Date.now()) => (skyTime(ms).night ? "dark" : "light");
