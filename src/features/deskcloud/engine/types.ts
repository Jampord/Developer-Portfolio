// Shared engine types. All sizes are in CSS pixels; the renderer applies DPR at draw time.

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
  /** Spring velocities for dx and dy */
  vdx: number;
  vdy: number;
};

export type Cloud = {
  x: number;
  y: number;
  /** Horizontal drift speed in px/s */
  vx: number;
  puffs: Puff[];
};
