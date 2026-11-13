import { describe, expect, it } from "vitest";
import { sky } from "../../themes/sky";
import { balloonRadius, createAccents, flapStrength, settleAccents, stepAccents, updateAccentTargets } from "../accents";
import { buildField } from "../field";
import { buildGrid } from "../grid";
import { mulberry32 } from "../random";
import { meteorAt } from "../renderer";
import type { Rect } from "../types";

const size = { width: 800, height: 600 };

function fieldFor(obstacles: Rect[]) {
  return buildField(buildGrid(size, obstacles, { cellSize: sky.cellSize, padding: sky.iconPadding }));
}

describe("flocks", () => {
  const accents = createAccents(size, fieldFor([]), sky, mulberry32(5));

  it("give every lead bird followers, within the theme's range", () => {
    const [min, max] = sky.birds.flock;
    for (const bird of accents.birds) {
      expect(bird.flock.length).toBeGreaterThanOrEqual(min);
      expect(bird.flock.length).toBeLessThanOrEqual(max);
    }
  });

  it("put followers behind the lead, on alternating sides", () => {
    for (const bird of accents.birds) {
      bird.flock.forEach((mate, i) => {
        expect(mate.dx).toBeLessThan(0);
        expect(Math.sign(mate.dy)).toBe(i % 2 ? 1 : -1);
      });
    }
  });

  it("are the same for the same seed", () => {
    const again = createAccents(size, fieldFor([]), sky, mulberry32(5));
    expect(again.birds).toEqual(accents.birds);
  });

  it("only re-enter once the last follower has left the sky", () => {
    const field = fieldFor([]);
    const flying = createAccents(size, field, sky, mulberry32(5));
    const bird = flying.birds[0];
    const far = Math.max(...bird.flock.map((m) => -m.dx));
    // The lead has just gone off the right edge, but its followers are still in view
    bird.x = size.width + sky.birds.size * 2 + far / 2;
    stepAccents(flying, 0.016, { field, size, theme: sky });
    expect(bird.x).toBeGreaterThan(size.width);
  });

  it("hide a follower that passes over an icon, without hiding the rest", () => {
    const flying = createAccents(size, fieldFor([]), sky, mulberry32(5));
    const bird = flying.birds[0];
    const mate = bird.flock[0];
    bird.x = 400;
    const icon = { x: bird.x + mate.dx - 30, y: bird.laneY + mate.dy - 30, width: 60, height: 60 };
    const field = fieldFor([icon]);
    settleAccents(flying, field);
    expect(mate.visibility).toBe(0);
  });

  it("flap for a while and then glide", () => {
    const strengths = Array.from({ length: 64 }, (_, i) => flapStrength((i / 64) * Math.PI * 2));
    expect(Math.max(...strengths)).toBe(1);
    expect(Math.min(...strengths)).toBeLessThan(0.2);
    for (const s of strengths) expect(s).toBeGreaterThan(0);
  });
});

describe("balloon", () => {
  it("floats inside its band, sized for the canvas", () => {
    const { balloon } = createAccents(size, fieldFor([]), sky, mulberry32(2));
    const [from, to] = sky.balloon.band;
    expect(balloon.baseY).toBeGreaterThanOrEqual(size.height * from);
    expect(balloon.baseY).toBeLessThanOrEqual(size.height * to);
    expect(balloon.radius).toBe(balloonRadius(size, sky));
    expect(balloon.radius).toBeGreaterThanOrEqual(sky.balloon.minRadius);
    expect(balloon.radius).toBeLessThanOrEqual(sky.balloon.maxRadius);
  });

  it("fades out over an icon and comes back in open sky", () => {
    const accents = createAccents(size, fieldFor([]), sky, mulberry32(2));
    const { balloon } = accents;
    const icon = { x: balloon.x - 40, y: balloon.baseY - 40, width: 80, height: 100 };
    const blocked = fieldFor([icon]);
    updateAccentTargets(accents, blocked, size, sky);
    balloon.baseY = icon.y + 40; // hold it over the icon
    settleAccents(accents, blocked);
    expect(balloon.visibility).toBe(0);

    const open = fieldFor([]);
    updateAccentTargets(accents, open, size, sky);
    settleAccents(accents, open);
    expect(balloon.visibility).toBe(1);
  });

  it("drifts to the right and comes round again", () => {
    const field = fieldFor([]);
    const accents = createAccents(size, field, sky, mulberry32(2));
    const { balloon } = accents;
    const before = balloon.x;
    stepAccents(accents, 1, { field, size, theme: sky });
    expect(balloon.x).toBeGreaterThan(before);

    balloon.x = size.width + balloon.radius * 3 + 1;
    stepAccents(accents, 0.016, { field, size, theme: sky });
    expect(balloon.x).toBeLessThan(0);
  });
});

describe("shooting stars", () => {
  const { every, duration } = sky.meteors;
  /** Every moment in the first ten minutes, a twentieth of a second apart */
  const moments = Array.from({ length: 600 * 20 }, (_, i) => i / 20);

  it("are the same at the same moment", () => {
    for (const t of [3.2, 41.7, 190.05]) expect(meteorAt(t, size, sky)).toEqual(meteorAt(t, size, sky));
  });

  it("fall now and then, not all the time", () => {
    const flying = moments.filter((t) => meteorAt(t, size, sky)).length / moments.length;
    expect(flying).toBeGreaterThan(0);
    expect(flying).toBeLessThan(duration / every);
  });

  it("stay in the upper sky and fall downward", () => {
    for (const t of moments) {
      const m = meteorAt(t, size, sky);
      if (!m) continue;
      expect(m.y).toBeLessThan(size.height * 0.55);
      expect(m.y).toBeGreaterThanOrEqual(m.tailY);
      expect(m.brightness).toBeGreaterThan(0);
      expect(m.brightness).toBeLessThanOrEqual(1);
    }
  });

  it("never appear on an empty canvas", () => {
    for (const t of moments.slice(0, 400)) expect(meteorAt(t, { width: 0, height: 0 }, sky)).toBeNull();
  });
});
