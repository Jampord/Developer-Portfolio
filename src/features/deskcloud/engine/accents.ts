import type { Theme } from "../themes/types";
import { between, intBetween, type CloudContext } from "./clouds";
import type { Field } from "./field";
import type { Rect, Size, Vec2 } from "./types";

/** The sun by day and the moon by night: one position, eased toward its target */
export type Orb = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  /** Drawn radius in px; it follows the canvas size (see orbRadius) */
  radius: number;
  /** 0–1: the orb fades out while even its best spot is too cramped (e.g. on a busy phone screen) */
  visibility: number;
  /** Below the horizon (on an arc placement), so not drawn at all */
  hidden: boolean;
  /** Whether its target spot is clear of whatever hides it (see OrbPlacement.blockers) */
  clear: boolean;
};

/** A point on the orb's arc: 0 rising on the left, 0.5 highest, 1 setting on the right; or below the horizon */
export type OrbArc = { progress: number } | "below";

/** Where the orb goes */
export type OrbPlacement = {
  /** Where the visible sky starts, in px from the canvas top (e.g. under a sticky header) */
  top: number;
  /** The horizon, in px up from the canvas bottom (e.g. above a taskbar) */
  horizon: number;
  /** null: the roomiest open sky. Otherwise a place on its arc across the sky, e.g. from the real time of day */
  arc: OrbArc | null;
  /**
   * What the orb fades out behind. null: every obstacle (with its padding). A list: only these boxes, so
   * it can pass behind solid things like icons and peek out around them.
   */
  blockers?: readonly Rect[] | null;
};

export const OPEN_SKY: OrbPlacement = { top: 0, horizon: 0, arc: null };

/** True when a circle doesn't overlap any of the boxes */
export function clearOf(rects: readonly Rect[], { x, y }: Vec2, radius: number): boolean {
  return rects.every((r) => {
    const dx = Math.max(r.x - x, 0, x - (r.x + r.width));
    const dy = Math.max(r.y - y, 0, y - (r.y + r.height));
    return dx * dx + dy * dy >= radius * radius;
  });
}

export type Bird = {
  x: number;
  y: number;
  /** The lane this bird is easing toward */
  laneY: number;
  speed: number;
  /** Wing-flap phase in radians */
  phase: number;
  /** 0–1: birds fade out as they pass close to an icon */
  visibility: number;
};

export type Star = {
  x: number;
  y: number;
  r: number;
  /** Twinkle phase and speed, in radians and radians per second */
  phase: number;
  speed: number;
  /** False while an icon (or its padding) covers the star */
  visible: boolean;
};

export type Accents = { orb: Orb; birds: Bird[]; stars: Star[] };

const LANE_GAP = 48;
const FLAP_RATE = 9; // radians per second
const TAU = Math.PI * 2;

/**
 * The roomiest spot in the top third of the sky, kept a little in from the edges.
 * With nothing on the canvas it sits top-right.
 *
 * `top` is where the open sky starts, in CSS px from the canvas top: the canvas can run behind
 * something that hides its top edge (a sticky header), and the orb should stay below it.
 */
export function findOrbSpot(field: Field, size: Size, radius: number, top = 0): Vec2 {
  const margin = radius * 1.6;
  const skyTop = clamp(top, 0, size.height);
  const minY = skyTop + margin;
  const maxY = Math.max(minY, skyTop + (size.height - skyTop) / 3);
  const fallback = {
    x: clamp(size.width * 0.78, margin, size.width - margin),
    y: clamp(skyTop + (size.height - skyTop) * 0.18, minY, maxY),
  };
  if (field.grid.blockedCount === 0) return fallback;

  const { cols, rows, cellSize } = field.grid;
  let best: Vec2 | null = null;
  let bestClearance = -1;

  for (let row = 0; row < rows; row++) {
    const y = (row + 0.5) * cellSize;
    if (y < minY) continue;
    if (y > maxY) break;
    for (let col = 0; col < cols; col++) {
      const x = (col + 0.5) * cellSize;
      if (x < margin || x > size.width - margin) continue;
      const c = field.clearance[row * cols + col];
      if (c > bestClearance) {
        bestClearance = c;
        best = { x, y };
      }
    }
  }

  return best ?? fallback;
}

/**
 * A point on the orb's arc: left to right with progress, rising from the horizon to just under the top
 * of the sky at 0.5. At 0 and 1 its centre sits on the horizon, half set.
 */
export function arcPoint(size: Size, radius: number, progress: number, top: number, horizon: number): Vec2 {
  const margin = radius * 1.6;
  const p = clamp(progress, 0, 1);
  const bottom = size.height - horizon;
  const peak = Math.min(bottom, top + margin);
  return {
    x: margin + Math.max(0, size.width - 2 * margin) * p,
    y: bottom - (bottom - peak) * Math.sin(Math.PI * p),
  };
}

/** Where the orb should be, and whether it's below the horizon */
function orbTarget(field: Field, size: Size, radius: number, placement: OrbPlacement) {
  const { arc, top, horizon, blockers = null } = placement;
  const spot =
    arc === null ? findOrbSpot(field, size, radius, top) : arcPoint(size, radius, arc === "below" ? 1 : arc.progress, top, horizon);
  const clear = blockers ? clearOf(blockers, spot, radius) : orbVisibility(field, spot.x, spot.y, radius) === 1;
  return { spot, hidden: arc === "below", clear };
}

const shownAt = (orb: Orb) => (orb.hidden || !orb.clear ? 0 : 1);

/** The orb grows with the sky: a share of the canvas's shorter side, within the theme's limits */
export function orbRadius(size: Size, theme: Theme): number {
  const { size: share, minRadius, maxRadius } = theme.orb;
  return clamp(Math.min(size.width, size.height) * share, minRadius, maxRadius);
}

/** 1 when the orb has room at this spot (clear of every padded icon), 0 when it would touch one */
export function orbVisibility(field: Field, x: number, y: number, radius: number): number {
  return field.sample(x, y) >= radius ? 1 : 0;
}

/** Horizontal lanes in the upper half with the most room on average, at least LANE_GAP apart */
function chooseLanes(field: Field, size: Size, count: number, rng: () => number): number[] {
  const step = field.grid.cellSize;
  const candidates: { y: number; score: number }[] = [];

  for (let y = size.height * 0.1; y <= size.height * 0.5; y += step) {
    let total = 0;
    let samples = 0;
    for (let x = step / 2; x < size.width; x += step * 4) {
      total += Math.min(field.sample(x, y), 400); // cap Infinity so empty canvases still compare
      samples++;
    }
    // A little jitter so lanes vary between layouts when the sky is empty
    candidates.push({ y, score: (samples ? total / samples : 400) + rng() * 20 });
  }

  candidates.sort((a, b) => b.score - a.score);
  const lanes: number[] = [];
  for (const c of candidates) {
    if (lanes.every((y) => Math.abs(y - c.y) >= LANE_GAP)) lanes.push(c.y);
    if (lanes.length === count) break;
  }
  while (lanes.length < count) lanes.push(size.height * 0.2 + lanes.length * LANE_GAP);
  return lanes.sort((a, b) => a - b);
}

/** A seeded star field over the top part of the sky; the count follows the canvas area */
function createStars(size: Size, field: Field, theme: Theme, rng: () => number): Star[] {
  const area = size.width * size.height;
  const count = area > 0 ? Math.round((theme.stars.density * area) / 100_000) : 0;
  const stars = Array.from({ length: count }, () => ({
    x: rng() * size.width,
    y: rng() * size.height * theme.stars.band,
    r: between(rng, theme.stars.radius),
    phase: rng() * TAU,
    speed: between(rng, theme.stars.twinkle),
    visible: true,
  }));
  updateStarVisibility(stars, field);
  return stars;
}

/** Stars inside an icon's padded box are skipped */
function updateStarVisibility(stars: Star[], field: Field) {
  for (const s of stars) s.visible = field.sample(s.x, s.y) > 0;
}

export function createAccents(
  size: Size,
  field: Field,
  theme: Theme,
  rng: () => number,
  placement: OrbPlacement = OPEN_SKY,
): Accents {
  const radius = orbRadius(size, theme);
  const { spot, hidden, clear } = orbTarget(field, size, radius, placement);
  const count = intBetween(rng, theme.birds.count);
  const lanes = chooseLanes(field, size, count, rng);

  const birds = lanes.map((laneY) => ({
    x: rng() * size.width,
    y: laneY,
    laneY,
    speed: between(rng, theme.birds.speed),
    phase: rng() * TAU,
    visibility: 1,
  }));

  return {
    orb: {
      x: spot.x,
      y: spot.y,
      tx: spot.x,
      ty: spot.y,
      radius,
      hidden,
      clear,
      visibility: hidden || !clear ? 0 : 1,
    },
    birds,
    stars: createStars(size, field, theme, rng),
  };
}

/** After the icons move: new spots for the orb and bird lanes (eased in stepAccents), and which stars show */
export function updateAccentTargets(
  accents: Accents,
  field: Field,
  size: Size,
  theme: Theme,
  placement: OrbPlacement = OPEN_SKY,
): void {
  accents.orb.radius = orbRadius(size, theme);
  const { spot, hidden, clear } = orbTarget(field, size, accents.orb.radius, placement);
  accents.orb.tx = spot.x;
  accents.orb.ty = spot.y;
  accents.orb.hidden = hidden;
  accents.orb.clear = clear;

  // Fixed seed: lanes depend only on where the icons are
  const lanes = chooseLanes(field, size, accents.birds.length, () => 0.5);
  const birds = [...accents.birds].sort((a, b) => a.laneY - b.laneY);
  birds.forEach((bird, i) => (bird.laneY = lanes[i]));

  updateStarVisibility(accents.stars, field);
}

export function stepAccents(accents: Accents, dt: number, { field, size, theme }: CloudContext): void {
  const ease = 1 - Math.exp(-theme.orb.ease * dt);
  const { orb } = accents;
  orb.x += (orb.tx - orb.x) * ease;
  orb.y += (orb.ty - orb.y) * ease;
  const shown = shownAt(orb);
  orb.visibility += (shown - orb.visibility) * Math.min(1, dt * 4);

  const span = theme.birds.size * 2;
  for (const bird of accents.birds) {
    bird.x += bird.speed * dt;
    if (bird.x - span > size.width) bird.x = -span;
    bird.y += (bird.laneY - bird.y) * ease;
    bird.phase = (bird.phase + FLAP_RATE * dt) % TAU;

    const target = clamp((field.sample(bird.x, bird.y) - 8) / 32, 0, 1);
    bird.visibility += (target - bird.visibility) * Math.min(1, dt * 6);
  }

  for (const star of accents.stars) star.phase = (star.phase + star.speed * dt) % TAU;
}

/** Jump straight to the targets (reduced motion, first paint). Stars keep their twinkle phase. */
export function settleAccents(accents: Accents, field?: Field): void {
  const { orb } = accents;
  orb.x = orb.tx;
  orb.y = orb.ty;
  orb.visibility = shownAt(orb);
  for (const bird of accents.birds) {
    bird.y = bird.laneY;
    if (field) bird.visibility = clamp((field.sample(bird.x, bird.y) - 8) / 32, 0, 1);
  }
  if (field) updateStarVisibility(accents.stars, field);
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
