import { describe, expect, it } from "vitest";
import { sky } from "../../themes/sky";
import { createAccents, findSunSpot, settleAccents, stepAccents, updateAccentTargets } from "../accents";
import { buildField } from "../field";
import { buildGrid } from "../grid";
import { mulberry32 } from "../random";
import type { Rect } from "../types";

const size = { width: 800, height: 600 };
const radius = sky.sun.radius;

function fieldFor(obstacles: Rect[]) {
  return buildField(buildGrid(size, obstacles, { cellSize: sky.cellSize, padding: sky.iconPadding }));
}

describe("findSunSpot", () => {
  it("sits in the top third, inside the canvas, when nothing is in the way", () => {
    const spot = findSunSpot(fieldFor([]), size, radius);
    expect(spot.y).toBeLessThanOrEqual(size.height / 3);
    expect(spot.x - radius).toBeGreaterThanOrEqual(0);
    expect(spot.x + radius).toBeLessThanOrEqual(size.width);
    expect(spot.y - radius).toBeGreaterThanOrEqual(0);
  });

  it("moves away from icons", () => {
    // Icons along the top-right, where the sun sits by default
    const icons = [500, 590, 680].map((x) => ({ x, y: 30, width: 72, height: 80 }));
    const field = fieldFor(icons);
    const spot = findSunSpot(field, size, radius);

    expect(spot.y).toBeLessThanOrEqual(size.height / 3);
    expect(field.sample(spot.x, spot.y)).toBeGreaterThan(radius * 2);
  });
});

describe("accents", () => {
  it("eases the sun to its new spot when icons move", () => {
    const accents = createAccents(size, fieldFor([]), sky, mulberry32(1));
    const start = { ...accents.sun };

    const icons = [{ x: start.x - 36, y: start.y - 40, width: 72, height: 80 }];
    const field = fieldFor(icons);
    updateAccentTargets(accents, field, size, sky);
    const ctx = { field, size, theme: sky };

    stepAccents(accents, 1 / 30, ctx);
    const afterOneFrame = Math.hypot(accents.sun.x - start.x, accents.sun.y - start.y);
    const total = Math.hypot(accents.sun.tx - start.x, accents.sun.ty - start.y);
    expect(afterOneFrame).toBeGreaterThan(0);
    expect(afterOneFrame).toBeLessThan(total);

    settleAccents(accents);
    expect(accents.sun.x).toBe(accents.sun.tx);
    expect(accents.sun.y).toBe(accents.sun.ty);
  });

  it("gives the day sky 2–3 birds", () => {
    const accents = createAccents(size, fieldFor([]), sky, mulberry32(5));
    expect(accents.birds.length).toBeGreaterThanOrEqual(2);
    expect(accents.birds.length).toBeLessThanOrEqual(3);
  });
});
