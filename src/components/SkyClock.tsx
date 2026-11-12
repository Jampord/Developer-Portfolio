"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { clockTheme, readSkyMode, useSkyMode } from "@/lib/sky-mode";

/** How often clock mode checks whether the sun has risen or set, in ms */
const CHECK_EVERY = 60_000;

/** In clock mode, keeps the site's light/dark in step with sunrise and sunset in Pampanga */
export function SkyClock() {
  const mode = useSkyMode();
  const { setTheme } = useTheme();

  useEffect(() => {
    // While hydrating, useSkyMode reports the server value ("clock") for one render. Check the
    // stored choice too, so a visitor who picked their own theme never has it overwritten.
    if (mode !== "clock" || readSkyMode() !== "clock") return;
    const sync = () => {
      if (readSkyMode() === "clock") setTheme(clockTheme());
    };
    sync();
    const timer = setInterval(sync, CHECK_EVERY);
    return () => clearInterval(timer);
  }, [mode, setTheme]);

  return null;
}
