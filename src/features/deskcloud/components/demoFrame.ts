// Shared look of the demo's frame, used by the demo itself and by the placeholder shown
// while it lazy-loads (so nothing shifts when it arrives). Data only: importing this
// doesn't pull in the engine.

import type { CSSProperties } from "react";
import { sky } from "../themes/sky";
import type { Rgb } from "../themes/types";

/** The demo box: full width, most of the viewport, never too short for the slot grid */
export const DEMO_FRAME_CLASS = "relative h-[85svh] min-h-[560px] w-full overflow-hidden";

export const TASKBAR_HEIGHT = 52;
export const TASKBAR_CLASS = "absolute inset-x-0 bottom-0 bg-sky-950/25 backdrop-blur-sm";

const gradient = (top: Rgb, bottom: Rgb) => `linear-gradient(rgb(${top.join(" ")}), rgb(${bottom.join(" ")}))`;

/** The Sky theme's gradient as CSS, shown before the canvas has drawn */
export const skyBackgroundStyle = {
  "--sky-day": gradient(sky.palettes.day.skyTop, sky.palettes.day.skyBottom),
  "--sky-night": gradient(sky.palettes.night.skyTop, sky.palettes.night.skyBottom),
} as CSSProperties;

/** Day gradient, or night when the site is in dark mode */
export const skyBackgroundClass = "bg-(image:--sky-day) dark:bg-(image:--sky-night)";
