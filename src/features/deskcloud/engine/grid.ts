import type { Rect, Size } from "./types";

export type GridOptions = {
  /** Cell edge length in px */
  cellSize: number;
  /** How far past each obstacle's edges cells count as blocked, in px */
  padding: number;
};

/** Occupancy grid: which cells are taken by (padded) obstacles */
export type Grid = {
  cellSize: number;
  cols: number;
  rows: number;
  /** 1 if the cell is blocked, row-major (index = row * cols + col) */
  blocked: Uint8Array;
  blockedCount: number;
};

export function cellIndex(grid: Pick<Grid, "cols">, col: number, row: number): number {
  return row * grid.cols + col;
}

/**
 * A cell is blocked when its centre lies inside any obstacle expanded by `padding`.
 * Rebuild only when the obstacles or the canvas size change.
 */
export function buildGrid(size: Size, obstacles: readonly Rect[], { cellSize, padding }: GridOptions): Grid {
  const cols = Math.max(0, Math.ceil(size.width / cellSize));
  const rows = Math.max(0, Math.ceil(size.height / cellSize));
  const blocked = new Uint8Array(cols * rows);
  let blockedCount = 0;

  for (const rect of obstacles) {
    // Cell c's centre is at (c + 0.5) * cellSize, so solve for the cells whose centre is in range
    const colStart = Math.max(0, Math.ceil((rect.x - padding) / cellSize - 0.5));
    const colEnd = Math.min(cols - 1, Math.floor((rect.x + rect.width + padding) / cellSize - 0.5));
    const rowStart = Math.max(0, Math.ceil((rect.y - padding) / cellSize - 0.5));
    const rowEnd = Math.min(rows - 1, Math.floor((rect.y + rect.height + padding) / cellSize - 0.5));

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        const i = row * cols + col;
        if (!blocked[i]) {
          blocked[i] = 1;
          blockedCount++;
        }
      }
    }
  }

  return { cellSize, cols, rows, blocked, blockedCount };
}
