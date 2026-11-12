import type { Palette, Rgb } from "../themes/types";
import type { Cloud, Size, Vec2 } from "./types";

// Clouds as one soft mass of vapour instead of separate balls. Every puff adds a smooth bump of
// "density" to a coarse grid; where puffs overlap their density adds up, so they fuse into one
// shape. A soft threshold turns density into opacity, so when puffs drift apart the cloud pinches,
// thins into wisps and tears, and heals again when they come back together. The fused shape is
// then shaded from the light's side: bright where it faces the sun or moon, grey where more
// cloud sits above. Plain TypeScript with no DOM, so it's testable; the renderer only uploads
// the result.

/** How far a puff's density reaches, as a multiple of its radius (more = puffs fuse sooner, but rounder) */
export const FUSE = 1.45;
/**
 * Peak density of one puff. Above 1, the threshold sits further out on the bump, so a puff
 * shows at about 1.1× its radius (as large as the old soft sprites) while its outline stays lobed.
 */
export const PUFF_DENSITY = 2;
/**
 * The density at a cloud's outline. The outline is traced as a smooth shape (traceVapour) and the
 * browser draws it at full screen resolution, so it's crisp and smooth on any screen however coarse
 * the grid is; scaling a grid of soft pixels up instead showed stair steps on big screens.
 */
export const EDGE = 0.3;
/** Just inside the outline the cloud is this opaque, firming up to solid over RIM more density: a soft vapour rim */
const RIM_ALPHA = 0.55;
const RIM = 0.3;
/** Grid cells per layer to aim for, which sets the cell size (bigger screens get coarser cells) */
const TARGET_CELLS = 80_000;
const MIN_CELL = 4;

/** Below this share of its size a squeezed puff adds nothing; above the second it adds in full */
const SQUEEZE_HIDE = 0.3;
const SQUEEZE_FULL = 0.55;

/** A puff moving faster than this (px/s) in the wind starts to stretch, up to 1 + MAX_STRETCH times its length */
const STRETCH_FROM = 40;
const STRETCH_SPEED = 220;
const MAX_STRETCH = 1.6;

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
  // In half-px steps, so the cost grows smoothly with the screen instead of jumping a whole px at a time
  const cell = Math.max(MIN_CELL, Math.ceil(2 * Math.sqrt((size.width * size.height) / TARGET_CELLS)) / 2);
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
      let amount = PUFF_DENSITY * smoothstep(SQUEEZE_HIDE, SQUEEZE_FULL, p.scale);
      const reach = p.r * p.scale * FUSE;
      if (amount <= 0 || reach < 0.5) continue;
      const cx = cloud.x + p.dx + p.wx;
      const cy = cloud.y + p.dy + p.wy;
      const inv = 1 / (reach * reach);

      // A puff the wind is carrying stretches into a thinner streak along its path, so torn-off
      // pieces read as wisps rather than balls
      const speed = Math.hypot(p.wvx, p.wvy);
      let along = 1;
      let across = 1;
      let ux = 1;
      let uy = 0;
      if (speed > STRETCH_FROM) {
        const e = 1 + Math.min(MAX_STRETCH, (speed - STRETCH_FROM) / STRETCH_SPEED);
        along = 1 / e;
        across = Math.sqrt(e);
        ux = p.wvx / speed;
        uy = p.wvy / speed;
        amount /= Math.pow(e, 0.35);
      }
      const extent = reach / along;
      const c0 = Math.max(0, Math.floor((cx - extent) / cell - 0.5));
      const c1 = Math.min(cols - 1, Math.ceil((cx + extent) / cell - 0.5));
      const r0 = Math.max(0, Math.floor((cy - extent) / cell - 0.5));
      const r1 = Math.min(rows - 1, Math.ceil((cy + extent) / cell - 0.5));
      if (c0 > c1 || r0 > r1) continue;
      if (c0 < bounds.minCol) bounds.minCol = c0;
      if (c1 > bounds.maxCol) bounds.maxCol = c1;
      if (r0 < bounds.minRow) bounds.minRow = r0;
      if (r1 > bounds.maxRow) bounds.maxRow = r1;
      for (let row = r0; row <= r1; row++) {
        const dy = (row + 0.5) * cell - cy;
        const base = row * cols;
        for (let col = c0; col <= c1; col++) {
          const dx = (col + 0.5) * cell - cx;
          const a = (dx * ux + dy * uy) * along;
          const b = (dy * ux - dx * uy) * across;
          const q = (a * a + b * b) * inv;
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
 * Turn the grid's density into straight-alpha RGBA pixels (one per cell): the cloud's colour and its
 * soft rim, to be drawn through the outline from traceVapour. `light` is where the light comes from
 * (the sun or moon); every point is lit mostly from above and partly from that side.
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
      // Colour reaches a little past the outline, so scaling it up never thins the edge (the outline clips it)
      if (d <= EDGE * 0.5) continue;
      const alpha = RIM_ALPHA + (1 - RIM_ALPHA) * smoothstep(EDGE, EDGE + RIM, d);

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

/** Receives each closed outline, wound so that cloud is on its right; holes come out the other way round */
export type OutlineSink = {
  /** `count` points in `points` (x, y pairs), the last joining back to the first */
  loop(points: Float64Array, count: number): void;
};

// Which sides of a square each marching-squares case cuts, as [from, to] pairs walked with cloud
// on the right. Sides: 0 top, 1 right, 2 bottom, 3 left. Cases 5 and 10 are saddles: the first set
// joins the two corners through the middle (when the centre is cloud), the second keeps them apart.
const CUTS: readonly (readonly number[])[] = [
  [], [3, 2], [2, 1], [3, 1], [1, 0], [1, 2, 3, 0], [2, 0], [3, 0],
  [0, 3], [0, 2], [0, 1, 2, 3], [0, 1], [1, 3], [1, 2], [2, 3], [],
];
const SADDLE_APART: Record<number, readonly number[]> = { 5: [1, 0, 3, 2], 10: [0, 3, 2, 1] };

type TraceScratch = {
  size: number;
  next: Int32Array;
  stamp: Uint32Array;
  px: Float32Array;
  py: Float32Array;
  /** Every point that starts a cut this frame, so loops are found without scanning the grid again */
  starts: Int32Array;
  frame: number;
};
let scratch: TraceScratch | null = null;
let loopPoints = new Float64Array(512);

/**
 * The clouds' outlines (where density crosses EDGE), traced with marching squares and joined into
 * closed loops. Each point sits where the density crosses EDGE along a square's side, so the loops
 * are smooth rather than following the cells; the renderer fills them, and the browser
 * anti-aliases them at full resolution. Outside the grid counts as clear sky, so clouds running
 * off the canvas still close.
 */
export function traceVapour(grid: VapourGrid, sink: OutlineSink): void {
  const { cell, cols, rows, density, bounds } = grid;
  if (bounds.minCol > bounds.maxCol) return;
  const T = EDGE;
  // Samples run from -1 to cols (and -1 to rows), so every square on the edge of the grid closes
  const W = cols + 2;
  const H = rows + 2;
  const size = W * H * 2;
  if (!scratch || scratch.size !== size) {
    scratch = {
      size,
      next: new Int32Array(size),
      stamp: new Uint32Array(size),
      px: new Float32Array(size),
      py: new Float32Array(size),
      starts: new Int32Array(size),
      frame: 0,
    };
  }
  const { next, stamp, px, py, starts } = scratch;
  let startCount = 0;
  const frame = ++scratch.frame;

  const at = (col: number, row: number) =>
    col < 0 || row < 0 || col >= cols || row >= rows ? 0 : density[row * cols + col];
  // Ids of the points on a square's sides: horizontal sides first, then vertical ones
  const hId = (col: number, row: number) => (row + 1) * W + col + 1;
  const vId = (col: number, row: number) => W * H + (row + 1) * W + col + 1;

  const c0 = Math.max(-1, bounds.minCol - 1);
  const c1 = Math.min(cols - 1, bounds.maxCol);
  const r0 = Math.max(-1, bounds.minRow - 1);
  const r1 = Math.min(rows - 1, bounds.maxRow);

  for (let row = r0; row <= r1; row++) {
    const y0 = (row + 0.5) * cell;
    // Away from the grid's edges the four corners are read straight from the grid
    const innerRow = row >= 0 && row + 1 < rows;
    const top = row * cols;
    const bottom = top + cols;
    let b = at(c0, row);
    let c = at(c0, row + 1);
    for (let col = c0; col <= c1; col++) {
      // Slide along the row: this square's left corners are the last one's right corners
      const a = b;
      const d = c;
      if (innerRow && col + 1 < cols) {
        b = density[top + col + 1];
        c = density[bottom + col + 1];
      } else {
        b = at(col + 1, row);
        c = at(col + 1, row + 1);
      }
      const code = (a >= T ? 8 : 0) | (b >= T ? 4 : 0) | (c >= T ? 2 : 0) | (d >= T ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const x0 = (col + 0.5) * cell;
      let cuts = CUTS[code];
      if ((code === 5 || code === 10) && (a + b + c + d) / 4 < T) cuts = SADDLE_APART[code];

      for (let k = 0; k < cuts.length; k += 2) {
        let from = -1;
        let to = -1;
        for (let e = 0; e < 2; e++) {
          const side = cuts[k + e];
          let id: number;
          let x: number;
          let y: number;
          if (side === 0) {
            id = hId(col, row);
            x = x0 + (cell * (T - a)) / (b - a);
            y = y0;
          } else if (side === 1) {
            id = vId(col + 1, row);
            x = x0 + cell;
            y = y0 + (cell * (T - b)) / (c - b);
          } else if (side === 2) {
            id = hId(col, row + 1);
            x = x0 + (cell * (T - d)) / (c - d);
            y = y0 + cell;
          } else {
            id = vId(col, row);
            x = x0;
            y = y0 + (cell * (T - a)) / (d - a);
          }
          px[id] = x;
          py[id] = y;
          if (e === 0) from = id;
          else to = id;
        }
        next[from] = to;
        stamp[from] = frame;
        starts[startCount++] = from;
      }
    }
  }
  // Walk each loop once: follow next[] from any unvisited start until it comes back round
  for (let si = 0; si < startCount; si++) {
    const startId = starts[si];
    if (stamp[startId] !== frame) continue;
    let count = 0;
    let id = startId;
    // A loop can't be longer than the points traced; guard against a broken chain all the same
    for (let guard = 0; guard < size && stamp[id] === frame; guard++) {
      if (count * 2 + 2 > loopPoints.length) {
        const grown = new Float64Array(loopPoints.length * 2);
        grown.set(loopPoints);
        loopPoints = grown;
      }
      loopPoints[count * 2] = px[id];
      loopPoints[count * 2 + 1] = py[id];
      count++;
      stamp[id] = 0; // visited
      id = next[id];
      if (id === startId) break;
    }
    if (count >= 3) sink.loop(loopPoints, count);
  }
}
