import type { Palette, Rgb } from "../themes/types";
import type { Cloud, Size, Vec2 } from "./types";

// Clouds as one soft mass of vapour instead of separate balls. Every puff adds a smooth bump of
// "density" to a coarse grid; where puffs overlap their density adds up, so they fuse into one
// shape. A soft threshold turns density into opacity, so when puffs drift apart the cloud pinches,
// thins into wisps and tears, and heals again when they come back together. The fused shape is
// then shaded from the light's side: bright where it faces the sun or moon, grey where more
// cloud sits above. Plain TypeScript with no DOM, so it's testable; the renderer only uploads
// the result.

/** How far a puff's density reaches, as a multiple of its radius (more = puffs fuse sooner) */
export const FUSE = 1.35;
/** Density below this is clear sky; above the second it's fully opaque cloud */
export const EDGE_LOW = 0.2;
export const EDGE_HIGH = 0.4;
/** Grid cells per layer to aim for, which sets the cell size (bigger screens get coarser cells) */
const TARGET_CELLS = 160_000;
const MIN_CELL = 3;

/** Below this share of its size a squeezed puff adds nothing; above the second it adds in full */
const SQUEEZE_HIDE = 0.3;
const SQUEEZE_FULL = 0.55;

export type VapourGrid = {
  /** Size of one cell in CSS px */
  cell: number;
  cols: number;
  rows: number;
  density: Float32Array;
  /** Cells the last splat touched (inclusive), so shading can skip the empty sky; empty when minCol > maxCol */
  bounds: { minCol: number; maxCol: number; minRow: number; maxRow: number };
};

/** A grid sized for the canvas, reusing `previous` when the size still matches */
export function vapourGrid(size: Size, previous?: VapourGrid | null): VapourGrid {
  const cell = Math.max(MIN_CELL, Math.ceil(Math.sqrt((size.width * size.height) / TARGET_CELLS)));
  const cols = Math.max(1, Math.ceil(size.width / cell));
  const rows = Math.max(1, Math.ceil(size.height / cell));
  if (previous && previous.cell === cell && previous.cols === cols && previous.rows === rows) return previous;
  return {
    cell,
    cols,
    rows,
    density: new Float32Array(cols * rows),
    bounds: { minCol: 0, maxCol: cols - 1, minRow: 0, maxRow: rows - 1 },
  };
}

const smoothstep = (lo: number, hi: number, x: number) => {
  const t = x <= lo ? 0 : x >= hi ? 1 : (x - lo) / (hi - lo);
  return t * t * (3 - 2 * t);
};

/** Add every puff of one layer to the grid (cleared first) as a smooth, compact bump of density */
export function splatClouds(grid: VapourGrid, clouds: readonly Cloud[], layer: Cloud["layer"]): void {
  const { cell, cols, rows, density, bounds } = grid;
  // Clear only what the last splat touched
  if (bounds.minCol <= bounds.maxCol) {
    for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
      density.fill(0, row * cols + bounds.minCol, row * cols + bounds.maxCol + 1);
    }
  }
  bounds.minCol = cols;
  bounds.maxCol = -1;
  bounds.minRow = rows;
  bounds.maxRow = -1;

  for (const cloud of clouds) {
    if (cloud.layer !== layer) continue;
    for (const p of cloud.puffs) {
      // A puff squeezed to a sliver would read as a stray dot, so it fades out instead
      const amount = smoothstep(SQUEEZE_HIDE, SQUEEZE_FULL, p.scale);
      const reach = p.r * p.scale * FUSE;
      if (amount <= 0 || reach < 0.5) continue;
      const cx = cloud.x + p.dx;
      const cy = cloud.y + p.dy;
      const inv = 1 / (reach * reach);
      const c0 = Math.max(0, Math.floor((cx - reach) / cell - 0.5));
      const c1 = Math.min(cols - 1, Math.ceil((cx + reach) / cell - 0.5));
      const r0 = Math.max(0, Math.floor((cy - reach) / cell - 0.5));
      const r1 = Math.min(rows - 1, Math.ceil((cy + reach) / cell - 0.5));
      if (c0 > c1 || r0 > r1) continue;
      if (c0 < bounds.minCol) bounds.minCol = c0;
      if (c1 > bounds.maxCol) bounds.maxCol = c1;
      if (r0 < bounds.minRow) bounds.minRow = r0;
      if (r1 > bounds.maxRow) bounds.maxRow = r1;
      for (let row = r0; row <= r1; row++) {
        const dy = (row + 0.5) * cell - cy;
        const dy2 = dy * dy;
        const base = row * cols;
        for (let col = c0; col <= c1; col++) {
          const dx = (col + 0.5) * cell - cx;
          const q = (dx * dx + dy2) * inv;
          if (q >= 1) continue;
          const k = 1 - q;
          density[base + col] += amount * k * k;
        }
      }
    }
  }
}

/** Colours for one layer, already blended for the time of day and the weather */
export type VapourColours = Pick<Palette, "cloud" | "cloudLight" | "cloudShadow">;

/** How strongly a density slope counts as an edge that catches (or turns from) the light */
const EDGE_GAIN = 3;
/** Inside the cloud the slope is gentle and lighting barely changes the colour, so it's skipped */
const MIN_LIT_SLOPE = 0.015;
/** How much cloud overhead darkens a point: sampled this many px up, with these weights */
const SHADE_NEAR = 12;
const SHADE_NEAR_WEIGHT = 0.45;
const SHADE_FAR = 26;
const SHADE_FAR_WEIGHT = 0.3;
const MAX_SHADE = 0.7;

/**
 * Turn the grid's density into straight-alpha RGBA pixels (one per cell). `light` is where the
 * light comes from (the sun or moon); every point is lit mostly from above and partly from that side.
 */
export function shadeVapour(
  grid: VapourGrid,
  out: Uint8ClampedArray,
  colours: VapourColours,
  light: Vec2,
  opacity: number,
): void {
  const { cell, cols, rows, density, bounds } = grid;
  const { cloud, cloudLight, cloudShadow } = colours;
  const near = Math.max(1, Math.round(SHADE_NEAR / cell));
  const far = Math.max(1, Math.round(SHADE_FAR / cell));
  const alphaScale = opacity * 255;

  out.fill(0);
  if (bounds.minCol > bounds.maxCol) return;

  for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
    const y = (row + 0.5) * cell;
    for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
      const i = row * cols + col;
      const d = density[i];
      if (d <= EDGE_LOW) continue;
      const alpha = smoothstep(EDGE_LOW, EDGE_HIGH, d);

      // Outward surface direction from the density slope (density rises into the cloud)
      const gx = (col < cols - 1 ? density[i + 1] : d) - (col > 0 ? density[i - 1] : d);
      const gy = (row < rows - 1 ? density[i + cols] : d) - (row > 0 ? density[i - cols] : d);
      const slope = Math.sqrt(gx * gx + gy * gy);
      let lit = 0;
      if (slope > MIN_LIT_SLOPE) {
        // Light mostly from above, leaning toward the sun or moon
        const tx = light.x - (col + 0.5) * cell;
        const ty = light.y - y;
        const tl = Math.sqrt(tx * tx + ty * ty) || 1;
        const lx = (0.45 * tx) / tl;
        const ly = (0.45 * ty) / tl - 1;
        const facing = (-gx * lx - gy * ly) / (slope * Math.sqrt(lx * lx + ly * ly));
        lit = facing * Math.min(1, slope * EDGE_GAIN);
      }

      // More cloud overhead, more shadow: bright tops, grey bases
      let shade = 0;
      if (row >= near) shade += density[i - near * cols] * SHADE_NEAR_WEIGHT;
      if (row >= far) shade += density[i - far * cols] * SHADE_FAR_WEIGHT;
      if (shade > MAX_SHADE) shade = MAX_SHADE;

      // Toward the lit colour on edges facing the light, toward the shadow on edges turned away,
      // then into the shadow by how much cloud is overhead (inlined: this runs for every cell)
      const toward: Rgb = lit >= 0 ? cloudLight : cloudShadow;
      const t = lit >= 0 ? lit : -lit * 0.8;
      const o = i * 4;
      for (let ch = 0; ch < 3; ch++) {
        const v = cloud[ch] + (toward[ch] - cloud[ch]) * t;
        out[o + ch] = v + (cloudShadow[ch] - v) * shade;
      }
      out[o + 3] = alpha * alphaScale;
    }
  }
}
