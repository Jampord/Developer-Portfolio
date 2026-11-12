// Shared look of the demo's frame, used by the demo itself and by the placeholder shown
// while it lazy-loads (so nothing shifts when it arrives). Data only: importing this
// doesn't pull in the engine.

import type { CSSProperties } from "react";
import { sky } from "../themes/sky";
import { SKY_MID } from "../engine/skyStops";
import type { Palette, Rgb } from "../themes/types";

/** The demo box: full width, most of the viewport, never too short for the slot grid (560 px fits 12 icons at 320 px wide) */
export const DEMO_FRAME_CLASS = "relative h-[70svh] max-h-[760px] min-h-[560px] w-full overflow-hidden";

export const TASKBAR_HEIGHT = 52;
export const TASKBAR_CLASS = "absolute inset-x-0 bottom-0 bg-sky-950/25 backdrop-blur-sm";

const rgb = (c: Rgb) => `rgb(${c.join(" ")})`;

/** Same stops as the renderer's sky */
const gradient = ({ skyTop, skyBottom, skyHaze }: Palette) =>
  `linear-gradient(${rgb(skyTop)}, ${rgb(skyBottom)} ${SKY_MID * 100}%, ${rgb(skyHaze)})`;

/** The Sky theme's gradient as CSS, shown before the canvas has drawn */
export const skyBackgroundStyle = {
  "--sky-day": gradient(sky.palettes.day),
  "--sky-night": gradient(sky.palettes.night),
} as CSSProperties;

/** Day gradient, or night when the site is in dark mode */
export const skyBackgroundClass = "bg-(image:--sky-day) dark:bg-(image:--sky-night)";
