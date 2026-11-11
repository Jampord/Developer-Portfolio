import { describe, expect, it } from "vitest";
import { buildField } from "../field";
import { buildGrid, cellIndex } from "../grid";

const CELL = 12;

// A 20 × 20 cell canvas with one obstacle whose padded box covers cols/rows 8–11
function singleObstacle() {
  const grid = buildGrid(
    { width: 240, height: 240 },
    [{ x: 96, y: 96, width: 48, height: 48 }],
    { cellSize: CELL, padding: 0 },
  );
  return { grid, field: buildField(grid) };
}

const centre = (cell: number) => (cell + 0.5) * CELL;

describe("buildField", () => {
  it("is Infinity everywhere when there are no obstacles", () => {
    const grid = buildGrid({ width: 120, height: 120 }, [], { cellSize: CELL, padding: 20 });
    const field = buildField(grid);

    expect(field.clearance.every((c) => c === Infinity)).toBe(true);
    expect(field.sample(60, 60)).toBe(Infinity);
    expect(field.gradient(60, 60)).toEqual({ x: 0, y: 0 });
  });

  it("is 0 on blocked cells", () => {
    const { grid, field } = singleObstacle();
    for (let i = 0; i < grid.blocked.length; i++) {
      if (grid.blocked[i]) expect(field.clearance[i]).toBe(0);
    }
  });

  it("grows with distance from the obstacle", () => {
    const { grid, field } = singleObstacle();
    let previous = 0;
    for (let col = 12; col < grid.cols; col++) {
      const c = field.clearance[cellIndex(grid, col, 9)];
      expect(c).toBeGreaterThan(previous);
      previous = c;
    }
  });

  it("measures straight-line distance in px along rows and columns", () => {
    const { grid, field } = singleObstacle();
    // The nearest blocked cell to (16, 9) is (11, 9), five cells away
    expect(field.clearance[cellIndex(grid, 16, 9)]).toBeCloseTo(5 * CELL);
    expect(field.clearance[cellIndex(grid, 9, 2)]).toBeCloseTo(6 * CELL);
  });

  it("stays close to the true distance on diagonals", () => {
    const { grid, field } = singleObstacle();
    // (15, 15) is 4 cells right and 4 down from the corner cell (11, 11)
    const exact = Math.hypot(4, 4) * CELL;
    const c = field.clearance[cellIndex(grid, 15, 15)];
    expect(Math.abs(c - exact) / exact).toBeLessThan(0.1);
  });

  it("samples exact values at cell centres", () => {
    const { grid, field } = singleObstacle();
    expect(field.sample(centre(16), centre(9))).toBeCloseTo(field.clearance[cellIndex(grid, 16, 9)]);
  });

  it("interpolates between cell centres", () => {
    const { grid, field } = singleObstacle();
    const a = field.clearance[cellIndex(grid, 15, 9)];
    const b = field.clearance[cellIndex(grid, 16, 9)];
    const midway = (centre(15) + centre(16)) / 2;
    expect(field.sample(midway, centre(9))).toBeCloseTo((a + b) / 2);
  });

  it("clamps samples outside the canvas to the edge", () => {
    const { grid, field } = singleObstacle();
    expect(field.sample(-100, centre(9))).toBeCloseTo(field.clearance[cellIndex(grid, 0, 9)]);
    expect(field.sample(1000, 1000)).toBeCloseTo(field.clearance[cellIndex(grid, 19, 19)]);
  });

  it("points the gradient away from a single obstacle", () => {
    const { field } = singleObstacle();
    const obstacleCentre = { x: 120, y: 120 };
    const points = [
      { x: 200, y: 120 }, // right
      { x: 40, y: 120 }, // left
      { x: 120, y: 30 }, // above
      { x: 120, y: 210 }, // below
      { x: 200, y: 200 }, // diagonal
      { x: 40, y: 50 }, // diagonal
    ];

    for (const p of points) {
      const g = field.gradient(p.x, p.y);
      const away = { x: p.x - obstacleCentre.x, y: p.y - obstacleCentre.y };
      const cos = (g.x * away.x + g.y * away.y) / (Math.hypot(g.x, g.y) * Math.hypot(away.x, away.y));
      expect(cos, `at ${p.x},${p.y}`).toBeGreaterThan(0.9);
    }
  });

  it("handles an empty canvas", () => {
    const grid = buildGrid({ width: 0, height: 0 }, [], { cellSize: CELL, padding: 20 });
    const field = buildField(grid);
    expect(field.sample(0, 0)).toBe(Infinity);
    expect(field.gradient(0, 0)).toEqual({ x: 0, y: 0 });
  });
});
