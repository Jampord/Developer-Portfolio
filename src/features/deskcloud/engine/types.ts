// Shared engine types. All sizes are in CSS pixels; the renderer applies DPR at draw time.

import type { Theme } from "../themes/types";

export type Vec2 = { x: number; y: number };

export type Size = { width: number; height: number };

/** An axis-aligned box, relative to the canvas (e.g. a desktop icon's bounds) */
export type Rect = { x: number; y: number; width: number; height: number };

export type Mode = "day" | "night";

/** One circle of a cloud. Offsets are relative to the cloud's centre. */
export type Puff = {
  /** Where the puff sits when nothing is in the way */
  restDx: number;
  restDy: number;
  /** Radius at scale 1 */
  r: number;
  /** Current offset and scale, eased toward their targets */
  dx: number;
  dy: number;
  scale: number;
  /** Spring velocities for dx, dy and scale */
  vdx: number;
  vdy: number;
  vscale: number;
  /** Where the wind has blown it from that offset, and how fast; eased home over a few seconds */
  wx: number;
  wy: number;
  wvx: number;
  wvy: number;
};

export type Cloud = {
  x: number;
  y: number;
  /** Horizontal drift speed in px/s */
  vx: number;
  /** Back clouds are smaller, slower and fainter, and drawn first */
  layer: "back" | "front";
  puffs: Puff[];
  /** The side it's flowing around an icon on: -1 over, 1 under, 0 when nothing is in the way */
  flow: -1 | 0 | 1;
};

export type EngineOptions = {
  theme: Theme;
  /** Same seed, same sky */
  seed?: number;
  /** Mode for the first paint (later changes cross-fade via setMode) */
  mode?: Mode;
};
