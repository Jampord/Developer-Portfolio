import type { Range, Theme } from "../themes/types";
import type { Field } from "./field";
import type { Cloud, Puff, Size } from "./types";

/** Fixed time step for settling, and the largest step the simulation takes at once */
export const SETTLE_DT = 1 / 30;
/** Extra room past each edge before a drifting cloud wraps around, in px */
export const WRAP_MARGIN = 16;
const PLACEMENT_TRIES = 24;

export type CloudContext = { field: Field; size: Size; theme: Theme };

export const between = (rng: () => number, [min, max]: Range) => min + (max - min) * rng();
export const intBetween = (rng: () => number, [min, max]: Range) => Math.floor(min + (max - min + 1) * rng());

/** Half the cloud's width at rest: how far its puffs reach from its centre */
export function cloudExtent(cloud: Cloud): number {
  let extent = 0;
  for (const p of cloud.puffs) extent = Math.max(extent, Math.abs(p.restDx) + p.r);
  return extent;
}

/**
 * A row of overlapping puffs, biggest in the middle, with their bottoms on one line
 * so the cloud has a flat base.
 */
function makePuffs(rng: () => number, count: number, baseRadius: number): Puff[] {
  const radii: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    radii.push(baseRadius * (0.6 + 0.5 * Math.sin(Math.PI * t)) * (0.85 + 0.3 * rng()));
  }

  const xs = [0];
  for (let i = 1; i < count; i++) xs.push(xs[i - 1] + (radii[i - 1] + radii[i]) * 0.55);
  const centre = xs[count - 1] / 2;
  const baseline = baseRadius * 0.5;

  return radii.map((r, i) => {
    const restDx = xs[i] - centre;
    const restDy = baseline - r;
    return { restDx, restDy, r, dx: restDx, dy: restDy, scale: 1, vdx: 0, vdy: 0, vscale: 0 };
  });
}

/**
 * Seeded placement. The cloud count follows the canvas area, and each centre is
 * re-rolled until it has room (clearance ≥ 0.8 × the cloud's radius). If no try
 * fits, the roomiest one wins.
 */
export function createClouds(size: Size, field: Field, theme: Theme, rng: () => number): Cloud[] {
  const area = size.width * size.height;
  if (area <= 0) return [];

  const { clouds: cfg } = theme;
  const count = Math.max(1, Math.round((theme.density * area) / 100_000));
  const clouds: Cloud[] = [];

  for (let i = 0; i < count; i++) {
    const layer = rng() < cfg.backShare ? "back" : "front";
    const puffs = makePuffs(rng, intBetween(rng, cfg.puffCount), between(rng, cfg[layer].radius));
    const cloud: Cloud = { x: 0, y: 0, vx: between(rng, cfg[layer].speed), layer, puffs };
    const needed = 0.8 * cloudExtent(cloud);

    let best = { x: 0, y: 0, clearance: -1 };
    for (let t = 0; t < PLACEMENT_TRIES; t++) {
      const x = rng() * size.width;
      const y = between(rng, cfg.band) * size.height;
      const clearance = field.sample(x, y);
      if (clearance > best.clearance) best = { x, y, clearance };
      if (clearance >= needed) break;
    }

    cloud.x = best.x;
    cloud.y = best.y;
    clouds.push(cloud);
  }

  return clouds;
}

/**
 * Advance the clouds by dt seconds: drift (optional), then ease every puff toward
 * its reflow target with a critically damped spring. Long frames are split into
 * steps of at most SETTLE_DT so the springs stay stable.
 */
export function stepClouds(clouds: Cloud[], dt: number, ctx: CloudContext, drift = true): void {
  if (dt <= 0) return;
  const steps = Math.max(1, Math.ceil(dt / SETTLE_DT - 1e-9));
  const h = dt / steps;
  for (let s = 0; s < steps; s++) {
    for (const cloud of clouds) {
      if (drift) driftCloud(cloud, h, ctx.size.width);
      reflowCloud(cloud, h, ctx);
    }
  }
}

/** Run fixed steps without drift, so the clouds reach their resting shapes in place */
export function settleClouds(clouds: Cloud[], steps: number, ctx: CloudContext): void {
  for (let i = 0; i < steps; i++) stepClouds(clouds, SETTLE_DT, ctx, false);
}

function driftCloud(cloud: Cloud, dt: number, width: number) {
  cloud.x += cloud.vx * dt;
  const e = cloudExtent(cloud) + WRAP_MARGIN;
  // Re-enter fully off-screen on the other side, so the wrap is never visible
  if (cloud.x - e > width) cloud.x -= width + 2 * e;
  else if (cloud.x + e < 0) cloud.x += width + 2 * e;
}

function reflowCloud(cloud: Cloud, dt: number, { field, theme }: CloudContext) {
  const k = theme.stiffness;
  const damping = 2 * Math.sqrt(k);

  for (const p of cloud.puffs) {
    // Targets depend on the rest position only, so a pushed puff doesn't feed back into its own target
    const px = cloud.x + p.restDx;
    const py = cloud.y + p.restDy;
    const c = field.sample(px, py);

    let tx = p.restDx;
    let ty = p.restDy;
    let ts = 1;

    if (c < p.r) {
      const [nx, ny] = awayFromIcons(field, px, py, p);
      const push = (p.r - c) * theme.pushStrength;
      tx += nx * push;
      ty += ny * push;
      // Shrink only by what the push couldn't clear (corners, gaps between icons), down to minScale.
      // A puff resting inside an icon's padded box has no clear way out, so it fades away instead.
      const room = field.sample(cloud.x + tx, cloud.y + ty);
      ts = c <= 0 ? 0 : Math.max(theme.minScale, Math.min(1, room / p.r));
    }

    p.vdx += (k * (tx - p.dx) - damping * p.vdx) * dt;
    p.vdy += (k * (ty - p.dy) - damping * p.vdy) * dt;
    p.vscale += (k * (ts - p.scale) - damping * p.vscale) * dt;
    p.dx += p.vdx * dt;
    p.dy += p.vdy * dt;
    p.scale += p.vscale * dt;
  }
}

/** Unit direction away from the nearest icons. Deep inside a padded icon the field is flat, so fall back to outward from the cloud. */
function awayFromIcons(field: Field, x: number, y: number, p: Puff): [number, number] {
  const g = field.gradient(x, y);
  const len = Math.hypot(g.x, g.y);
  if (len > 1e-6) return [g.x / len, g.y / len];
  const restLen = Math.hypot(p.restDx, p.restDy);
  if (restLen > 1e-6) return [p.restDx / restLen, p.restDy / restLen];
  return [0, -1];
}
