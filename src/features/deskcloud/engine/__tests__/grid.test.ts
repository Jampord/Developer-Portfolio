import { describe, expect, it } from "vitest";
import { buildGrid, cellIndex } from "../grid";

const options = { cellSize: 12, padding: 20 };

function isBlocked(grid: ReturnType<typeof buildGrid>, col: number, row: number) {
  return grid.blocked[cellIndex(grid, col, row)] === 1;
}

function countBlocked(grid: ReturnType<typeof buildGrid>) {
  return grid.blocked.reduce((sum, v) => sum + v, 0);
}

describe("buildGrid", () => {
  it("covers the canvas with whole cells", () => {
    const grid = buildGrid({ width: 250, height: 120 }, [], options);
    expect(grid.cols).toBe(21);
    expect(grid.rows).toBe(10);
    expect(grid.blocked.length).toBe(210);
  });

  it("blocks no cells when there are no obstacles", () => {
    const grid = buildGrid({ width: 240, height: 120 }, [], options);
    expect(countBlocked(grid)).toBe(0);
    expect(grid.blockedCount).toBe(0);
  });

  it("blocks exactly the cells whose centre lies inside the padded rect", () => {
    // Padded rect spans x 80–140 and y 20–80.
    // Cell centres are at 6, 18, 30, ... so cols 7–11 and rows 2–6 are inside.
    const grid = buildGrid({ width: 240, height: 120 }, [{ x: 100, y: 40, width: 20, height: 20 }], options);

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const inside = col >= 7 && col <= 11 && row >= 2 && row <= 6;
        expect(isBlocked(grid, col, row), `cell ${col},${row}`).toBe(inside);
      }
    }
    expect(grid.blockedCount).toBe(25);
  });

  it("merges overlapping obstacles without double counting", () => {
    const rect = { x: 100, y: 40, width: 20, height: 20 };
    // The second rect is one cell to the right: together they cover cols 7–12, rows 2–6
    const grid = buildGrid({ width: 240, height: 120 }, [rect, { ...rect, x: 112 }], options);
    expect(isBlocked(grid, 12, 4)).toBe(true); // reached only by the shifted rect
    expect(grid.blockedCount).toBe(30);
    expect(countBlocked(grid)).toBe(30);
  });

  it("clips obstacles that hang off the canvas", () => {
    const grid = buildGrid(
      { width: 120, height: 120 },
      [{ x: -50, y: -50, width: 60, height: 60 }],
      { cellSize: 12, padding: 0 },
    );
    expect(isBlocked(grid, 0, 0)).toBe(true);
    expect(isBlocked(grid, 1, 0)).toBe(false);
    expect(grid.blockedCount).toBe(1);
  });

  it("ignores obstacles entirely outside the canvas", () => {
    const grid = buildGrid({ width: 120, height: 120 }, [{ x: 500, y: 500, width: 40, height: 40 }], options);
    expect(grid.blockedCount).toBe(0);
  });

  it("handles an empty canvas", () => {
    const grid = buildGrid({ width: 0, height: 0 }, [{ x: 0, y: 0, width: 10, height: 10 }], options);
    expect(grid.cols).toBe(0);
    expect(grid.rows).toBe(0);
    expect(grid.blocked.length).toBe(0);
  });
});
