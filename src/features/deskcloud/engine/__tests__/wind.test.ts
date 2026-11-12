import { describe, expect, it } from "vitest";
import { sky } from "../../themes/sky";
import { blowClouds, createClouds, settleClouds, stepClouds } from "../clouds";
import { buildField } from "../field";
import { buildGrid } from "../grid";
import { mulberry32 } from "../random";
import type { Cloud, Rect } from "../types";
import { createWind, gust, setWindSolids, stepWind, windAt } from "../wind";

const size = { width: 800, height: 500 };
const DT = 1 / 30;

function setup(obstacles: Rect[] = []) {
  const field = buildField(buildGrid(size, obstacles, { cellSize: sky.cellSize, padding: sky.iconPadding }));
  const wind = createWind(size);
  setWindSolids(wind, field);
  return { field, wind };
}

function run(clouds: Cloud[], { field, wind }: ReturnType<typeof setup>, seconds: number, each?: (frame: number) => void) {
  const ctx = { field, size, theme: sky };
  for (let f = 0; f < Math.round(seconds / DT); f++) {
    each?.(f);
    stepWind(wind, DT);
    stepClouds(clouds, DT, ctx, false);
    blowClouds(clouds, wind, DT, field);
  }
}

const air = () => ({ x: 0, y: 0 });

describe("wind", () => {
  it("moves the air where a gust is pushed, then dies down to calm", () => {
    const { wind } = setup();
    gust(wind, 400, 250, 600, 0, 80, 0.6);
    expect(windAt(wind, 400, 250, air()).x).toBeGreaterThan(200);

    for (let i = 0; i < 30; i++) stepWind(wind, DT);
    expect(windAt(wind, 400, 250, air()).x).toBeGreaterThan(0); // still blowing after a second, weaker
    for (let i = 0; i < 150; i++) stepWind(wind, DT);
    expect(wind.active).toBe(false);
    expect(windAt(wind, 400, 250, air()).x).toBe(0);
  });

  it("carries a gust along the way it blows", () => {
    const { wind } = setup();
    gust(wind, 300, 250, 800, 0, 60, 0.8);
    for (let i = 0; i < 6; i++) stepWind(wind, DT);
    expect(windAt(wind, 400, 250, air()).x).toBeGreaterThan(windAt(wind, 200, 250, air()).x);
  });

  it("has no air inside an icon, and slides along its edge instead of into it", () => {
    const icon = { x: 380, y: 200, width: 80, height: 80 };
    const setupWithIcon = setup([icon]);
    const { wind } = setupWithIcon;
    // Blow straight at the icon's left side
    for (let i = 0; i < 10; i++) {
      gust(wind, 300, 240, 700, 0, 70, 0.6);
      stepWind(wind, DT);
    }
    expect(windAt(wind, 420, 240, air())).toEqual({ x: 0, y: 0 });
    // Just outside its padding the air no longer heads in
    expect(windAt(wind, icon.x - sky.iconPadding - 14, 240, air()).x).toBeLessThan(80);
  });
});

describe("blowClouds", () => {
  it("bends a cloud with a gust, then heals it back to rest within a few seconds", () => {
    const s = setup();
    const clouds = createClouds(size, s.field, sky, mulberry32(3));
    settleClouds(clouds, 30, { field: s.field, size, theme: sky });
    const cloud = clouds[0];
    let furthest = 0;
    run(clouds, s, 0.6, (f) => {
      if (f < 8) gust(s.wind, cloud.x - 60 + f * 20, cloud.y, 900, 0, 80, 0.55);
      furthest = Math.max(furthest, ...cloud.puffs.map((p) => p.wx));
    });
    expect(furthest).toBeGreaterThan(30); // visibly blown
    expect(furthest).toBeLessThan(250); // but not flung across the sky

    run(clouds, s, 4);
    for (const p of cloud.puffs) {
      expect(Math.abs(p.wx)).toBeLessThan(4);
      expect(Math.abs(p.wy)).toBeLessThan(4);
    }
  });

  it("never blows a puff onto an icon", () => {
    const icon = { x: 420, y: 180, width: 90, height: 90 };
    const s = setup([icon]);
    const clouds = createClouds(size, s.field, sky, mulberry32(7));
    settleClouds(clouds, 60, { field: s.field, size, theme: sky });
    let worst = 0;
    run(clouds, s, 1.5, (f) => {
      // Gusts aimed straight at the icon from every side
      if (f < 20) {
        gust(s.wind, icon.x - 60, icon.y + 45, 900, 0, 120, 0.6);
        gust(s.wind, icon.x + 45, icon.y - 60, 0, 900, 120, 0.6);
      }
      for (const cloud of clouds) {
        for (const p of cloud.puffs) {
          const x = cloud.x + p.dx + p.wx;
          const y = cloud.y + p.dy + p.wy;
          const ox = Math.max(icon.x - x, 0, x - (icon.x + icon.width));
          const oy = Math.max(icon.y - y, 0, y - (icon.y + icon.height));
          worst = Math.max(worst, p.r * p.scale * 0.85 - Math.hypot(ox, oy));
        }
      }
    });
    expect(worst).toBeLessThan(sky.cellSize); // never reaches into the icon itself
  });

  it("leaves a calm sky exactly as it was", () => {
    const s = setup();
    const clouds = createClouds(size, s.field, sky, mulberry32(5));
    settleClouds(clouds, 30, { field: s.field, size, theme: sky });
    const before = JSON.stringify(clouds);
    blowClouds(clouds, s.wind, DT, s.field);
    expect(JSON.stringify(clouds)).toBe(before);
  });
});
