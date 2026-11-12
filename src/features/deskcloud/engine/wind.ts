import type { Field } from "./field";
import type { Size, Vec2 } from "./types";

// The air over the sky: a coarse grid of velocities. Gusts are pushed in where the cursor (or a
// finger, or a dragged icon) moves; each step the air carries itself along (so a gust travels and
// curls), spreads a little, and dies down. Icons and the hero's name are solid: no air moves inside
// them, and air next to them slides along their edge instead of into it, so it bends around them
// like water around a rock. Plain TypeScript with no DOM.

export type WindOptions = {
  /** Cell size in CSS px */
  cell: number;
  /** Seconds for a gust to fall to about a third of its speed */
  fade: number;
  /** How much each step blends a cell with its neighbours, per second */
  spread: number;
  /** Fastest the air may move, in px/s */
  maxSpeed: number;
};

export const WIND: WindOptions = { cell: 20, fade: 0.45, spread: 3, maxSpeed: 900 };

export type Wind = {
  options: WindOptions;
  cols: number;
  rows: number;
  u: Float32Array;
  v: Float32Array;
  /** Scratch buffers for advection */
  nu: Float32Array;
  nv: Float32Array;
  /** 1 inside icons and other solid areas */
  solid: Uint8Array;
  /** Outward direction from the nearest solid area, for cells close enough to slide along it */
  nx: Float32Array;
  ny: Float32Array;
  /** False once the air has died down, so a calm sky costs nothing */
  active: boolean;
};

export function createWind(size: Size, options: WindOptions = WIND): Wind {
  const cols = Math.max(1, Math.ceil(size.width / options.cell));
  const rows = Math.max(1, Math.ceil(size.height / options.cell));
  const n = cols * rows;
  return {
    options,
    cols,
    rows,
    u: new Float32Array(n),
    v: new Float32Array(n),
    nu: new Float32Array(n),
    nv: new Float32Array(n),
    solid: new Uint8Array(n),
    nx: new Float32Array(n),
    ny: new Float32Array(n),
    active: false,
  };
}

/** Mark solid cells and the outward direction near them, from the icons' clearance field */
export function setWindSolids(wind: Wind, field: Field): void {
  const { cols, rows, options, solid, nx, ny, u, v } = wind;
  const { cell } = options;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      const x = (col + 0.5) * cell;
      const y = (row + 0.5) * cell;
      const c = field.sample(x, y);
      solid[i] = c < cell * 0.5 ? 1 : 0;
      nx[i] = 0;
      ny[i] = 0;
      if (solid[i]) {
        u[i] = 0;
        v[i] = 0;
      } else if (c < cell * 2.5) {
        const g = field.gradient(x, y);
        const len = Math.hypot(g.x, g.y);
        if (len > 1e-6) {
          nx[i] = g.x / len;
          ny[i] = g.y / len;
        }
      }
    }
  }
}

/**
 * Push air at (x, y) toward velocity (vx, vy) px/s, strongest at the centre and fading out at
 * `radius`. `weight` (0–1) is how far the air there is pulled to that velocity at the centre.
 */
export function gust(wind: Wind, x: number, y: number, vx: number, vy: number, radius: number, weight: number): void {
  const { cols, rows, options, u, v, solid } = wind;
  const { cell, maxSpeed } = options;
  const speed = Math.hypot(vx, vy);
  if (speed < 1 || radius <= 0 || weight <= 0) return;
  const scale = speed > maxSpeed ? maxSpeed / speed : 1;
  const gx = vx * scale;
  const gy = vy * scale;
  const inv = 1 / (radius * radius);
  const c0 = Math.max(0, Math.floor((x - radius) / cell));
  const c1 = Math.min(cols - 1, Math.floor((x + radius) / cell));
  const r0 = Math.max(0, Math.floor((y - radius) / cell));
  const r1 = Math.min(rows - 1, Math.floor((y + radius) / cell));
  for (let row = r0; row <= r1; row++) {
    const dy = (row + 0.5) * cell - y;
    for (let col = c0; col <= c1; col++) {
      const i = row * cols + col;
      if (solid[i]) continue;
      const dx = (col + 0.5) * cell - x;
      const q = (dx * dx + dy * dy) * inv;
      if (q >= 1) continue;
      const w = weight * (1 - q) * (1 - q);
      u[i] += (gx - u[i]) * w;
      v[i] += (gy - v[i]) * w;
      wind.active = true;
    }
  }
}

/** Below this speed (px/s) everywhere, the air counts as calm and stops costing anything */
const CALM = 2;

/** Advance the air by dt seconds: carry, spread, slide along solids, fade */
export function stepWind(wind: Wind, dt: number): void {
  if (!wind.active || dt <= 0) return;
  const { cols, rows, options, u, v, nu, nv, solid, nx, ny } = wind;
  const { cell, fade, spread } = options;

  // Carry: each cell takes the air from where it came from a moment ago (semi-Lagrangian)
  const steps = dt / cell;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      if (solid[i]) {
        nu[i] = 0;
        nv[i] = 0;
        continue;
      }
      const fx = col - u[i] * steps;
      const fy = row - v[i] * steps;
      nu[i] = bilinear(u, cols, rows, fx, fy);
      nv[i] = bilinear(v, cols, rows, fx, fy);
    }
  }

  // Spread to neighbours, slide along solids, and fade
  const blend = Math.min(0.5, spread * dt) / 4;
  const keep = Math.exp(-dt / fade);
  let fastest = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      if (solid[i]) {
        u[i] = 0;
        v[i] = 0;
        continue;
      }
      const l = col > 0 ? i - 1 : i;
      const r = col < cols - 1 ? i + 1 : i;
      const t = row > 0 ? i - cols : i;
      const b = row < rows - 1 ? i + cols : i;
      let a = nu[i] + blend * (nu[l] + nu[r] + nu[t] + nu[b] - 4 * nu[i]);
      let c = nv[i] + blend * (nv[l] + nv[r] + nv[t] + nv[b] - 4 * nv[i]);
      // Near a solid area, drop the part of the flow heading into it, so the air slides along its edge
      const into = a * nx[i] + c * ny[i];
      if (into < 0) {
        a -= into * nx[i];
        c -= into * ny[i];
      }
      a *= keep;
      c *= keep;
      u[i] = a;
      v[i] = c;
      const s = Math.abs(a) + Math.abs(c);
      if (s > fastest) fastest = s;
    }
  }
  if (fastest < CALM) {
    u.fill(0);
    v.fill(0);
    wind.active = false;
  }
}

/** The air's velocity at a point in CSS px (zero outside the grid or when calm) */
export function windAt(wind: Wind, x: number, y: number, out: Vec2): Vec2 {
  if (!wind.active) {
    out.x = 0;
    out.y = 0;
    return out;
  }
  const { cols, rows, options, u, v } = wind;
  const fx = x / options.cell - 0.5;
  const fy = y / options.cell - 0.5;
  out.x = bilinear(u, cols, rows, fx, fy);
  out.y = bilinear(v, cols, rows, fx, fy);
  return out;
}

/** Bilinear sample at fractional cell coordinates (cell centres at whole numbers), clamped to the grid */
function bilinear(a: Float32Array, cols: number, rows: number, x: number, y: number): number {
  const cx = x < 0 ? 0 : x > cols - 1 ? cols - 1 : x;
  const cy = y < 0 ? 0 : y > rows - 1 ? rows - 1 : y;
  const c0 = Math.floor(cx);
  const r0 = Math.floor(cy);
  const c1 = c0 < cols - 1 ? c0 + 1 : c0;
  const r1 = r0 < rows - 1 ? r0 + 1 : r0;
  const tx = cx - c0;
  const ty = cy - r0;
  const top = a[r0 * cols + c0] * (1 - tx) + a[r0 * cols + c1] * tx;
  const bottom = a[r1 * cols + c0] * (1 - tx) + a[r1 * cols + c1] * tx;
  return top * (1 - ty) + bottom * ty;
}
