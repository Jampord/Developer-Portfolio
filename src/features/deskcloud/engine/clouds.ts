import type { Range, Theme } from "../themes/types";
import type { Field } from "./field";
import type { Cloud, Mover, Puff, Size } from "./types";

/** Fixed time step for settling, and the largest step the simulation takes at once */
export const SETTLE_DT = 1 / 30;
/** Extra room past each edge before a drifting cloud wraps around, in px */
export const WRAP_MARGIN = 16;
const PLACEMENT_TRIES = 24;
/** How far along a cloud a detour bends its neighbours, in multiples of the two puffs' radii */
const FLOW_SPREAD = 1.5;

// Scratch space for reflow, reused every frame (a cloud has a handful of puffs)
const clearances: number[] = [];
const detours: (number | null)[] = [];

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
    const cloud: Cloud = { x: 0, y: 0, vx: between(rng, cfg[layer].speed), layer, puffs, flow: 0 };
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

/**
 * The wake behind icons being dragged: puffs near a fast-moving icon pick up its velocity (like air
 * dragged along by a passing hand) plus a little sideways push that curls them out around its
 * path. Only their velocities change, so the reflow springs carry them back once it has passed.
 */
export function applyWake(clouds: Cloud[], movers: readonly Mover[], dt: number, theme: Theme): void {
  const { reach, drag, swirl, minSpeed } = theme.wake;
  for (const m of movers) {
    const speed = Math.hypot(m.vx, m.vy);
    if (speed < minSpeed) continue;
    const range = m.radius + reach;
    for (const cloud of clouds) {
      // Cheap reject: the whole cloud is out of range
      if (Math.abs(cloud.x - m.x) > range + cloudExtent(cloud) + 60) continue;
      for (const p of cloud.puffs) {
        const ox = cloud.x + p.dx - m.x;
        const oy = cloud.y + p.dy - m.y;
        const d = Math.hypot(ox, oy);
        if (d >= range) continue;
        const near = 1 - d / range;
        const k = Math.min(1, drag * near * near * dt);
        // Which side of the icon's path the puff is on, so the swirl pushes it away from the path
        const side = Math.sign(m.vx * oy - m.vy * ox) || 1;
        const sx = (-m.vy / speed) * side * swirl * speed;
        const sy = (m.vx / speed) * side * swirl * speed;
        p.vdx += (m.vx + sx - p.vdx) * k;
        p.vdy += (m.vy + sy - p.vdy) * k;
      }
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

  const { puffs } = cloud;
  const step = theme.cellSize / 2;

  // Flow around: the cloud passes over or under an icon, like water around a rock. Every puff that
  // would touch it slides straight up (or down) to where it fits whole, and the cloud keeps that
  // side until it's past, so it never tears in two or swings through the icon midway.
  // Clearance is measured to blocked cells' centres, so half a cell is added to clear their edges too.
  // Targets depend on rest positions only, so a moved puff doesn't feed back into its own target.
  let blocked = false;
  for (let i = 0; i < puffs.length; i++) {
    const p = puffs[i];
    const c = field.sample(cloud.x + p.restDx, cloud.y + p.restDy);
    clearances[i] = c;
    if (c < p.r) blocked = true;
  }
  if (!blocked) cloud.flow = 0;
  else if (!cloud.flow || !flowAround(cloud, cloud.flow, field, theme, step)) {
    // Pick the side that needs the smaller detour; with neither in reach (a block too tall, like the
    // hero's name) the whole cloud parts the old way, so no puff ends up floating alone
    const up = flowAround(cloud, -1, field, theme, step);
    const upCost = up ? maxDetour(puffs.length) : Infinity;
    const down = flowAround(cloud, 1, field, theme, step);
    const downCost = down ? maxDetour(puffs.length) : Infinity;
    cloud.flow = upCost === Infinity && downCost === Infinity ? 0 : upCost <= downCost ? -1 : 1;
    if (cloud.flow !== 0) flowAround(cloud, cloud.flow, field, theme, step);
  }
  if (blocked && cloud.flow === 0) for (let i = 0; i < puffs.length; i++) detours[i] = null;
  else if (!blocked) for (let i = 0; i < puffs.length; i++) detours[i] = 0;

  for (let i = 0; i < puffs.length; i++) {
    const p = puffs[i];
    const px = cloud.x + p.restDx;
    const py = cloud.y + p.restDy;
    const c = clearances[i];

    let tx = p.restDx;
    let ty = p.restDy;
    let ts = 1;
    let detour = detours[i];

    if (detour !== null) {
      // Neighbours bend along with a detour, so the cloud arcs around the icon in one piece
      // instead of one puff breaking off on its own
      for (let j = 0; j < puffs.length; j++) {
        const other = detours[j];
        if (j === i || !other || (detour !== 0 && Math.sign(other) !== Math.sign(detour))) continue;
        const w = 1 - Math.abs(p.restDx - puffs[j].restDx) / (FLOW_SPREAD * (p.r + puffs[j].r));
        const bent = other * w;
        if (w > 0 && Math.abs(bent) > Math.abs(detour) && field.sample(px, py + bent) >= p.r) detour = bent;
      }
      ty += detour;
    } else if (c < p.r) {
      // Too far to go around (a large block): part sideways and shrink, as before
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

/** Fill `detours` with each puff's shift toward `dir` (-1 up, 1 down). False if any puff can't get there. */
function flowAround(cloud: Cloud, dir: -1 | 1, field: Field, theme: Theme, step: number): boolean {
  const { puffs } = cloud;
  for (let i = 0; i < puffs.length; i++) {
    const p = puffs[i];
    if (clearances[i] >= p.r) {
      detours[i] = 0;
      continue;
    }
    const d = verticalDetour(field, cloud.x + p.restDx, cloud.y + p.restDy, p.r + step, dir, theme.flowReach, step);
    if (d === null) return false;
    detours[i] = d;
  }
  return true;
}

function maxDetour(count: number): number {
  let max = 0;
  for (let i = 0; i < count; i++) max = Math.max(max, Math.abs(detours[i] ?? 0));
  return max;
}

/**
 * The vertical shift toward `dir` (-1 up, 1 down) to the first point with at least `need`
 * clearance, searched up to `reach` px in `step`s and interpolated between samples so it changes
 * smoothly as the cloud drifts. Null when it isn't within reach.
 */
export function verticalDetour(
  field: Field,
  x: number,
  y: number,
  need: number,
  dir: -1 | 1,
  reach: number,
  step: number,
): number | null {
  let prevD = 0;
  let prevC = field.sample(x, y);
  if (prevC >= need) return 0;
  for (let d = step; d <= reach; d += step) {
    const c = field.sample(x, y + dir * d);
    if (c >= need) return dir * (prevD + (step * (need - prevC)) / (c - prevC));
    prevD = d;
    prevC = c;
  }
  return null;
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
