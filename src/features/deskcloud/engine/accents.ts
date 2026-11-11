import type { Theme } from "../themes/types";
import { between, intBetween, type CloudContext } from "./clouds";
import type { Field } from "./field";
import type { Size, Vec2 } from "./types";

export type Sun = { x: number; y: number; tx: number; ty: number };

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

export type Accents = { sun: Sun; birds: Bird[] };

const LANE_GAP = 48;
const FLAP_RATE = 9; // radians per second

/**
 * The roomiest spot in the top third of the canvas, kept a little in from the edges.
 * With nothing on the canvas it sits top-right.
 */
export function findSunSpot(field: Field, size: Size, radius: number): Vec2 {
  const margin = radius * 1.6;
  const fallback = {
    x: clamp(size.width * 0.78, margin, size.width - margin),
    y: clamp(size.height * 0.18, margin, Math.max(margin, size.height / 3)),
  };
  if (field.grid.blockedCount === 0) return fallback;

  const { cols, rows, cellSize } = field.grid;
  const maxY = Math.max(margin, size.height / 3);
  let best: Vec2 | null = null;
  let bestClearance = -1;

  for (let row = 0; row < rows; row++) {
    const y = (row + 0.5) * cellSize;
    if (y < margin) continue;
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

export function createAccents(size: Size, field: Field, theme: Theme, rng: () => number): Accents {
  const spot = findSunSpot(field, size, theme.sun.radius);
  const count = intBetween(rng, theme.birds.count);
  const lanes = chooseLanes(field, size, count, rng);

  return {
    sun: { x: spot.x, y: spot.y, tx: spot.x, ty: spot.y },
    birds: lanes.map((laneY) => ({
      x: rng() * size.width,
      y: laneY,
      laneY,
      speed: between(rng, theme.birds.speed),
      phase: rng() * Math.PI * 2,
      visibility: 1,
    })),
  };
}

/** Pick new spots for the sun and bird lanes after the icons move; they ease there in stepAccents */
export function updateAccentTargets(accents: Accents, field: Field, size: Size, theme: Theme): void {
  const spot = findSunSpot(field, size, theme.sun.radius);
  accents.sun.tx = spot.x;
  accents.sun.ty = spot.y;

  // Fixed seed: lanes depend only on where the icons are
  const lanes = chooseLanes(field, size, accents.birds.length, () => 0.5);
  const birds = [...accents.birds].sort((a, b) => a.laneY - b.laneY);
  birds.forEach((bird, i) => (bird.laneY = lanes[i]));
}

export function stepAccents(accents: Accents, dt: number, { field, size, theme }: CloudContext): void {
  const ease = 1 - Math.exp(-theme.sun.ease * dt);
  const { sun } = accents;
  sun.x += (sun.tx - sun.x) * ease;
  sun.y += (sun.ty - sun.y) * ease;

  const span = theme.birds.size * 2;
  for (const bird of accents.birds) {
    bird.x += bird.speed * dt;
    if (bird.x - span > size.width) bird.x = -span;
    bird.y += (bird.laneY - bird.y) * ease;
    bird.phase = (bird.phase + FLAP_RATE * dt) % (Math.PI * 2);

    const target = clamp((field.sample(bird.x, bird.y) - 8) / 32, 0, 1);
    bird.visibility += (target - bird.visibility) * Math.min(1, dt * 6);
  }
}

/** Jump straight to the targets (reduced motion, first paint) */
export function settleAccents(accents: Accents, field?: Field): void {
  accents.sun.x = accents.sun.tx;
  accents.sun.y = accents.sun.ty;
  for (const bird of accents.birds) {
    bird.y = bird.laneY;
    if (field) bird.visibility = clamp((field.sample(bird.x, bird.y) - 8) / 32, 0, 1);
  }
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
