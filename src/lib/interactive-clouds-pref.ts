"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the hero's sky reacts to what's on the page: clouds flowing around the icons and the
 * hero's content, the sun or moon keeping clear of the name, the balloon fading near icons.
 * Off (the default), the sky ignores the page and drifts on behind it. Remembered per visitor.
 */
export const INTERACTIVE_CLOUDS_KEY = "interactive-clouds";

const CHANGE_EVENT = "interactiveclouds:change";

function read(): boolean {
  try {
    return localStorage.getItem(INTERACTIVE_CLOUDS_KEY) === "on";
  } catch {
    return false;
  }
}

export function setInteractiveClouds(on: boolean) {
  try {
    localStorage.setItem(INTERACTIVE_CLOUDS_KEY, on ? "on" : "off");
  } catch {
    // Storage can be blocked; the choice then lasts for this page only
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === INTERACTIVE_CLOUDS_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useInteractiveClouds(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
