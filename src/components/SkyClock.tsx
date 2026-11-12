"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { clockTheme, useSkyMode } from "@/lib/sky-mode";

/** How often clock mode checks whether the sun has risen or set, in ms */
const CHECK_EVERY = 60_000;

/** In clock mode, keeps the site's light/dark in step with sunrise and sunset in Pampanga */
export function SkyClock() {
  const mode = useSkyMode();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (mode !== "clock") return;
    const sync = () => setTheme(clockTheme());
    sync();
    const timer = setInterval(sync, CHECK_EVERY);
    return () => clearInterval(timer);
  }, [mode, setTheme]);

  return null;
}
