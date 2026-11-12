import { describe, expect, it } from "vitest";
import { sky } from "../../themes/sky";
import type { Cloud, Puff } from "../types";
import { EDGE_HIGH, EDGE_LOW, shadeVapour, splatClouds, vapourGrid } from "../vapour";

const size = { width: 400, height: 300 };

function puff(dx: number, dy: number, r: number, scale = 1): Puff {
  return { restDx: dx, restDy: dy, r, dx, dy, scale, vdx: 0, vdy: 0, vscale: 0 };
}

function cloud(x: number, y: number, puffs: Puff[], layer: Cloud["layer"] = "front"): Cloud {
  return { x, y, vx: 0, layer, puffs, flow: 0 };
}

/** Density at a point in CSS px */
function densityAt(grid: ReturnType<typeof vapourGrid>, x: number, y: number) {
  const col = Math.floor(x / grid.cell);
  const row = Math.floor(y / grid.cell);
  return grid.density[row * grid.cols + col];
}

describe("splatClouds", () => {
  it("fuses neighbouring puffs, so the gap between them is solid cloud", () => {
    const grid = vapourGrid(size);
    // Spaced the way a cloud's puffs are at rest: centres about 0.55 × (r1 + r2) apart
    splatClouds(grid, [cloud(200, 150, [puff(-17, 0, 30), puff(16, 0, 30)])], "front");
    expect(densityAt(grid, 200, 150)).toBeGreaterThan(EDGE_HIGH);
  });

  it("tears puffs pulled far apart, leaving clear sky between them", () => {
    const grid = vapourGrid(size);
    splatClouds(grid, [cloud(200, 150, [puff(-80, 0, 30), puff(80, 0, 30)])], "front");
    expect(densityAt(grid, 200, 150)).toBeLessThan(EDGE_LOW);
    expect(densityAt(grid, 120, 150)).toBeGreaterThan(EDGE_HIGH); // each piece is still cloud
  });

  it("thins into a wisp in between, at a middling distance", () => {
    const grid = vapourGrid(size);
    splatClouds(grid, [cloud(200, 150, [puff(-30, 0, 30), puff(30, 0, 30)])], "front");
    const middle = densityAt(grid, 200, 150);
    expect(middle).toBeGreaterThan(EDGE_LOW);
    expect(middle).toBeLessThan(densityAt(grid, 170, 150));
  });

  it("only adds the layer asked for, and clears what it drew last time", () => {
    const grid = vapourGrid(size);
    splatClouds(grid, [cloud(100, 100, [puff(0, 0, 30)], "back")], "back");
    expect(densityAt(grid, 100, 100)).toBeGreaterThan(0);
    splatClouds(grid, [cloud(100, 100, [puff(0, 0, 30)], "back")], "front");
    expect(densityAt(grid, 100, 100)).toBe(0);
  });

  it("lets a squeezed puff fade out instead of leaving a dot", () => {
    const grid = vapourGrid(size);
    splatClouds(grid, [cloud(200, 150, [puff(0, 0, 30, 0.2)])], "front");
    expect(densityAt(grid, 200, 150)).toBe(0);
  });
});

describe("shadeVapour", () => {
  function shaded(light = { x: 200, y: -500 }) {
    const grid = vapourGrid(size);
    splatClouds(grid, [cloud(200, 150, [puff(-17, 0, 30), puff(16, 0, 30)])], "front");
    const out = new Uint8ClampedArray(grid.cols * grid.rows * 4);
    shadeVapour(grid, out, sky.palettes.day, light, 1);
    const at = (x: number, y: number) => {
      const i = (Math.floor(y / grid.cell) * grid.cols + Math.floor(x / grid.cell)) * 4;
      return [out[i], out[i + 1], out[i + 2], out[i + 3]];
    };
    return at;
  }

  const brightness = ([r, g, b]: number[]) => r + g + b;

  it("is clear sky away from the cloud and opaque inside it", () => {
    const at = shaded();
    expect(at(20, 20)[3]).toBe(0);
    expect(at(200, 150)[3]).toBe(255);
  });

  it("has bright tops and greyer bases", () => {
    const at = shaded();
    expect(brightness(at(200, 128))).toBeGreaterThan(brightness(at(200, 172)));
  });

  it("is brighter on the side facing the sun", () => {
    const at = shaded({ x: 1400, y: 150 });
    expect(brightness(at(240, 150))).toBeGreaterThan(brightness(at(160, 150)));
  });
});
