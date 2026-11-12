import { describe, expect, it } from "vitest";
import { sky } from "../../themes/sky";
import { createAccents, findOrbSpot, settleAccents, stepAccents, updateAccentTargets } from "../accents";
import { buildField } from "../field";
import { buildGrid } from "../grid";
import { mulberry32 } from "../random";
import type { Rect } from "../types";

const size = { width: 800, height: 600 };
const radius = sky.orb.radius;

function fieldFor(obstacles: Rect[]) {
  return buildField(buildGrid(size, obstacles, { cellSize: sky.cellSize, padding: sky.iconPadding }));
}

describe("findOrbSpot (sun by day, moon by night)", () => {
  it("sits in the top third, inside the canvas, when nothing is in the way", () => {
    const spot = findOrbSpot(fieldFor([]), size, radius);
    expect(spot.y).toBeLessThanOrEqual(size.height / 3);
    expect(spot.x - radius).toBeGreaterThanOrEqual(0);
    expect(spot.x + radius).toBeLessThanOrEqual(size.width);
    expect(spot.y - radius).toBeGreaterThanOrEqual(0);
  });

  it("moves away from icons", () => {
    // Icons along the top-right, where the orb sits by default
    const icons = [500, 590, 680].map((x) => ({ x, y: 30, width: 72, height: 80 }));
    const field = fieldFor(icons);
    const spot = findOrbSpot(field, size, radius);

    expect(spot.y).toBeLessThanOrEqual(size.height / 3);
    expect(field.sample(spot.x, spot.y)).toBeGreaterThan(radius * 2);
  });

  it("stays below the top line it's given, in the top third of the sky under it", () => {
    const top = 120;
    // An icon at the top-left makes the top-right corner the roomiest spot, right under the line
    const icons = [{ x: 30, y: 200, width: 72, height: 80 }];
    for (const field of [fieldFor([]), fieldFor(icons)]) {
      const spot = findOrbSpot(field, size, radius, top);
      expect(spot.y - radius).toBeGreaterThanOrEqual(top);
      expect(spot.y).toBeLessThanOrEqual(top + (size.height - top) / 3);
    }
  });
});

describe("accents", () => {
  it("eases the orb to its new spot when icons move", () => {
    const accents = createAccents(size, fieldFor([]), sky, mulberry32(1));
    const start = { ...accents.orb };

    const icons = [{ x: start.x - 36, y: start.y - 40, width: 72, height: 80 }];
    const field = fieldFor(icons);
    updateAccentTargets(accents, field, size, sky);
    const ctx = { field, size, theme: sky };

    stepAccents(accents, 1 / 30, ctx);
    const afterOneFrame = Math.hypot(accents.orb.x - start.x, accents.orb.y - start.y);
    const total = Math.hypot(accents.orb.tx - start.x, accents.orb.ty - start.y);
    expect(afterOneFrame).toBeGreaterThan(0);
    expect(afterOneFrame).toBeLessThan(total);

    settleAccents(accents);
    expect(accents.orb.x).toBe(accents.orb.tx);
    expect(accents.orb.y).toBe(accents.orb.ty);
  });

  it("hides the orb when even its best spot is too cramped, and shows it again once there is room", () => {
    // Icons tiled across the whole top half of the sky
    const icons: Rect[] = [];
    for (let y = 0; y < size.height / 2; y += 90) for (let x = 0; x < size.width; x += 80) icons.push({ x, y, width: 72, height: 80 });
    const crowded = fieldFor(icons);
    const accents = createAccents(size, crowded, sky, mulberry32(1));
    expect(accents.orb.visibility).toBe(0);

    const open = fieldFor([]);
    updateAccentTargets(accents, open, size, sky);
    settleAccents(accents, open, sky);
    expect(accents.orb.visibility).toBe(1);
  });

  it("gives the day sky 2–3 birds", () => {
    const accents = createAccents(size, fieldFor([]), sky, mulberry32(5));
    expect(accents.birds.length).toBeGreaterThanOrEqual(2);
    expect(accents.birds.length).toBeLessThanOrEqual(3);
  });
});

describe("stars", () => {
  it("lay out the same field for the same seed", () => {
    const a = createAccents(size, fieldFor([]), sky, mulberry32(3));
    const b = createAccents(size, fieldFor([]), sky, mulberry32(3));
    expect(a.stars).toEqual(b.stars);
  });

  it("scale their count with the canvas area", () => {
    const { stars } = createAccents(size, fieldFor([]), sky, mulberry32(3));
    expect(stars.length).toBe(Math.round((sky.stars.density * size.width * size.height) / 100_000));
  });

  it("stay in the upper part of the sky", () => {
    const { stars } = createAccents(size, fieldFor([]), sky, mulberry32(3));
    for (const s of stars) {
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(size.height * sky.stars.band);
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(size.width);
    }
  });

  it("hide where icons are, and come back when they move away", () => {
    const accents = createAccents(size, fieldFor([]), sky, mulberry32(3));
    expect(accents.stars.every((s) => s.visible)).toBe(true);

    // A big block over the top-left quarter of the sky
    const icons = [{ x: 0, y: 0, width: 400, height: 220 }];
    const field = fieldFor(icons);
    updateAccentTargets(accents, field, size, sky);

    const hidden = accents.stars.filter((s) => !s.visible);
    expect(hidden.length).toBeGreaterThan(0);
    for (const s of accents.stars) expect(s.visible).toBe(field.sample(s.x, s.y) > 0);

    updateAccentTargets(accents, fieldFor([]), size, sky);
    expect(accents.stars.every((s) => s.visible)).toBe(true);
  });

  it("twinkle as time passes, but not while settling", () => {
    const field = fieldFor([]);
    const accents = createAccents(size, field, sky, mulberry32(3));
    const phases = accents.stars.map((s) => s.phase);

    settleAccents(accents, field);
    expect(accents.stars.map((s) => s.phase)).toEqual(phases);

    stepAccents(accents, 1 / 30, { field, size, theme: sky });
    expect(accents.stars.map((s) => s.phase)).not.toEqual(phases);
  });
});
