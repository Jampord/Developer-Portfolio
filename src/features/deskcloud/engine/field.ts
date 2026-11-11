import type { Grid } from "./grid";
import type { Vec2 } from "./types";

/** Clearance field: how far each point is from the nearest blocked cell */
export type Field = {
  grid: Grid;
  /** Distance in px from each cell's centre to the nearest blocked cell's centre (0 on blocked cells) */
  clearance: Float32Array;
  /** Bilinear clearance at any point in px. Infinity when nothing is blocked. */
  sample(x: number, y: number): number;
  /** Rate of change of clearance; points away from obstacles. {0, 0} when nothing is blocked. */
  gradient(x: number, y: number): Vec2;
};

// Chamfer 3-4 weights: a straight step costs 3, a diagonal step 4 (≈ 3√2)
const STRAIGHT = 3;
const DIAGONAL = 4;

/**
 * Two-pass chamfer distance transform over the occupancy grid.
 * The forward pass carries distances down and right, the backward pass up and left.
 */
export function buildField(grid: Grid): Field {
  const { cols, rows, blocked, cellSize } = grid;
  const d = new Float32Array(cols * rows);
  for (let i = 0; i < d.length; i++) d[i] = blocked[i] ? 0 : Infinity;

  if (grid.blockedCount > 0) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        let v = d[i];
        if (col > 0) v = Math.min(v, d[i - 1] + STRAIGHT);
        if (row > 0) {
          const up = i - cols;
          v = Math.min(v, d[up] + STRAIGHT);
          if (col > 0) v = Math.min(v, d[up - 1] + DIAGONAL);
          if (col < cols - 1) v = Math.min(v, d[up + 1] + DIAGONAL);
        }
        d[i] = v;
      }
    }

    for (let row = rows - 1; row >= 0; row--) {
      for (let col = cols - 1; col >= 0; col--) {
        const i = row * cols + col;
        let v = d[i];
        if (col < cols - 1) v = Math.min(v, d[i + 1] + STRAIGHT);
        if (row < rows - 1) {
          const down = i + cols;
          v = Math.min(v, d[down] + STRAIGHT);
          if (col < cols - 1) v = Math.min(v, d[down + 1] + DIAGONAL);
          if (col > 0) v = Math.min(v, d[down - 1] + DIAGONAL);
        }
        d[i] = v;
      }
    }

    // Chamfer units → px
    const toPx = cellSize / STRAIGHT;
    for (let i = 0; i < d.length; i++) d[i] *= toPx;
  }

  const empty = grid.blockedCount === 0 || cols === 0 || rows === 0;

  function sample(x: number, y: number): number {
    if (empty) return Infinity;

    // Position in cell-centre coordinates, clamped to the grid
    const gx = clamp(x / cellSize - 0.5, 0, cols - 1);
    const gy = clamp(y / cellSize - 0.5, 0, rows - 1);
    const c0 = Math.floor(gx);
    const r0 = Math.floor(gy);
    const c1 = Math.min(c0 + 1, cols - 1);
    const r1 = Math.min(r0 + 1, rows - 1);
    const tx = gx - c0;
    const ty = gy - r0;

    const top = d[r0 * cols + c0] * (1 - tx) + d[r0 * cols + c1] * tx;
    const bottom = d[r1 * cols + c0] * (1 - tx) + d[r1 * cols + c1] * tx;
    return top * (1 - ty) + bottom * ty;
  }

  function gradient(x: number, y: number): Vec2 {
    if (empty) return { x: 0, y: 0 };
    const h = cellSize;
    return {
      x: (sample(x + h, y) - sample(x - h, y)) / (2 * h),
      y: (sample(x, y + h) - sample(x, y - h)) / (2 * h),
    };
  }

  return { grid, clearance: d, sample, gradient };
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
