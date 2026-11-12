import { describe, expect, it } from "vitest";
import { sky } from "../../themes/sky";
import type { Cloud, Puff } from "../types";
import { EDGE, PUFF_DENSITY, FUSE, shadeVapour, splatClouds, traceVapour, vapourGrid } from "../vapour";

const size = { width: 400, height: 300 };


function puff(dx: number, dy: number, r: number, scale = 1): Puff {
  return { restDx: dx, restDy: dy, r, dx, dy, scale, vdx: 0, vdy: 0, vscale: 0, wx: 0, wy: 0, wvx: 0, wvy: 0 };
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
    expect(densityAt(grid, 200, 150)).toBeGreaterThan(EDGE * 2);
  });

  it("tears puffs pulled far apart, leaving clear sky between them", () => {
    const grid = vapourGrid(size);
    splatClouds(grid, [cloud(200, 150, [puff(-80, 0, 30), puff(80, 0, 30)])], "front");
    expect(densityAt(grid, 200, 150)).toBeLessThan(EDGE);
    expect(densityAt(grid, 120, 150)).toBeGreaterThan(EDGE * 2); // each piece is still cloud
  });

  it("thins into a wisp in between, at a middling distance", () => {
    const grid = vapourGrid(size);
    splatClouds(grid, [cloud(200, 150, [puff(-34, 0, 30), puff(34, 0, 30)])], "front");
    const middle = densityAt(grid, 200, 150);
    expect(middle).toBeGreaterThan(EDGE);
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

describe("traceVapour", () => {
  /** Area inside the traced outline, by adding up the pieces */
  function tracedArea(puffs: Puff[]) {
    const grid = vapourGrid(size);
    splatClouds(grid, [cloud(200, 150, puffs)], "front");
    let area = 0;
    let pieces = 0;
    traceVapour(grid, {
      loop: (points, count) => {
        // Signed: outlines count positive (wound with cloud on the right), holes negative
        let twice = 0;
        for (let i = 0; i < count; i++) {
          const j = (i + 1) % count;
          twice += points[i * 2] * points[j * 2 + 1] - points[j * 2] * points[i * 2 + 1];
        }
        area += twice / 2;
        pieces++;
      },
    });
    return { area, pieces };
  }

  it("traces a single puff as a smooth circle of the right size", () => {
    const r = 30;
    // The outline sits where PUFF_DENSITY × (1 − (d / reach)²)² = EDGE
    const reach = r * FUSE;
    const shown = reach * Math.sqrt(1 - Math.sqrt(EDGE / PUFF_DENSITY));
    const { area } = tracedArea([puff(0, 0, r)]);
    expect(area / (Math.PI * shown * shown)).toBeGreaterThan(0.95);
    expect(area / (Math.PI * shown * shown)).toBeLessThan(1.05);
  });

  it("traces two pulled-apart puffs as two separate loops", () => {
    expect(tracedArea([puff(-90, 0, 30), puff(90, 0, 30)]).pieces).toBe(2);
    expect(tracedArea([puff(-17, 0, 30), puff(16, 0, 30)]).pieces).toBe(1);
    const together = tracedArea([puff(-17, 0, 30), puff(16, 0, 30)]).area;
    const apart = tracedArea([puff(-90, 0, 30), puff(90, 0, 30)]).area;
    const one = tracedArea([puff(0, 0, 30)]).area;
    expect(apart).toBeCloseTo(2 * one, -1); // two whole puffs, with clear sky between
    expect(together).toBeLessThan(2 * one); // fused, they overlap
  });

  it("traces nothing for an empty sky", () => {
    expect(tracedArea([]).pieces).toBe(0);
  });
});
