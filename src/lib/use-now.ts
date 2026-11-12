"use client";

import { useSyncExternalStore } from "react";

/**
 * The current time, rounded down to `step` ms and refreshed every `step`. Null while server
 * rendering and hydrating, so time-dependent text never mismatches.
 */
export function useNow(step: number): number | null {
  return useSyncExternalStore(
    (onChange) => {
      const timer = setInterval(onChange, Math.min(step, 15_000));
      return () => clearInterval(timer);
    },
    () => Math.floor(Date.now() / step) * step,
    () => null,
  );
}
