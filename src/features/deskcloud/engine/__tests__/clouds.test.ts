import { describe, expect, it } from "vitest";
import { sky } from "../../themes/sky";
import { applyWake, cloudExtent, createClouds, settleClouds, stepClouds, type CloudContext } from "../clouds";
import { buildField } from "../field";
import { buildGrid } from "../grid";
import { mulberry32 } from "../random";
import type { Cloud, Rect } from "../types";

const size = { width: 800, height: 500 };
const ICON = { width: 72, height: 80 };

function context(obstacles: Rect[]): CloudContext {
  const grid = buildGrid(size, obstacles, { cellSize: sky.cellSize, padding: sky.iconPadding });
  return { field: buildField(grid), size, theme: sky };
}

const padded = (r: Rect): Rect => ({
  x: r.x - sky.iconPadding,
  y: r.y - sky.iconPadding,
  width: r.width + 2 * sky.iconPadding,
  height: r.height + 2 * sky.iconPadding,
});

/** How far the deepest puff reaches into any of the rects, in px (negative = clear of all of them) */
function worstOverlap(clouds: Cloud[], rects: Rect[]): number {
  let worst = -Infinity;
  for (const cloud of clouds) {
    for (const p of cloud.puffs) {
      const cx = cloud.x + p.dx;
      const cy = cloud.y + p.dy;
      const radius = p.r * p.scale;
      for (const r of rects) {
        const ox = Math.max(r.x - cx, 0, cx - (r.x + r.width));
        const oy = Math.max(r.y - cy, 0, cy - (r.y + r.height));
        worst = Math.max(worst, radius - Math.hypot(ox, oy));
      }
    }
  }
  return worst;
}

/** Icons centred on the first few clouds, so they start out overlapping */
function iconsOnClouds(clouds: Cloud[], count: number, shiftX = 0): Rect[] {
  return clouds.slice(0, count).map((c) => ({
    x: ((c.x + shiftX + size.width) % size.width) - ICON.width / 2,
    y: c.y - ICON.height / 2,
    ...ICON,
  }));
}

describe("createClouds", () => {
  it("lays out the same clouds for the same seed", () => {
    const ctx = context([]);
    expect(createClouds(size, ctx.field, sky, mulberry32(3))).toEqual(createClouds(size, ctx.field, sky, mulberry32(3)));
  });

  it("scales the cloud count with the canvas area", () => {
    const { field } = context([]);
    const clouds = createClouds(size, field, sky, mulberry32(1));
    expect(clouds.length).toBe(Math.round((sky.density * size.width * size.height) / 100_000));
  });

  it("gives every cloud 4–7 puffs that start at rest", () => {
    const { field } = context([]);
    for (const cloud of createClouds(size, field, sky, mulberry32(9))) {
      expect(cloud.puffs.length).toBeGreaterThanOrEqual(4);
      expect(cloud.puffs.length).toBeLessThanOrEqual(7);
      for (const p of cloud.puffs) {
        expect(p).toMatchObject({ dx: p.restDx, dy: p.restDy, scale: 1, vdx: 0, vdy: 0, vscale: 0 });
      }
    }
  });

  it("places cloud centres away from icons", () => {
    const icons = [{ x: 360, y: 200, ...ICON }];
    const { field } = context(icons);
    for (const cloud of createClouds(size, field, sky, mulberry32(5))) {
      expect(field.sample(cloud.x, cloud.y)).toBeGreaterThanOrEqual(0.8 * cloudExtent(cloud));
    }
  });

  it("returns no clouds for an empty canvas", () => {
    const { field } = context([]);
    expect(createClouds({ width: 0, height: 0 }, field, sky, mulberry32(1))).toEqual([]);
  });
});

describe("reflow", () => {
  it("moves every puff out of the icons after settling", () => {
    const clouds = createClouds(size, context([]).field, sky, mulberry32(11));
    const icons = iconsOnClouds(clouds, 3);
    expect(worstOverlap(clouds, icons.map(padded))).toBeGreaterThan(20); // they really start overlapping

    settleClouds(clouds, 200, context(icons));

    expect(worstOverlap(clouds, icons)).toBeLessThan(0.01); // never touches an icon (sub-pixel float slack)
    expect(worstOverlap(clouds, icons.map(padded))).toBeLessThanOrEqual(sky.cellSize); // within one grid cell of the padding
  });

  it("stays clear after an icon moves and the clouds settle again", () => {
    const clouds = createClouds(size, context([]).field, sky, mulberry32(11));
    settleClouds(clouds, 200, context(iconsOnClouds(clouds, 3)));

    const moved = iconsOnClouds(clouds, 3, 150);
    settleClouds(clouds, 200, context(moved));

    expect(worstOverlap(clouds, moved)).toBeLessThan(0.01);
    expect(worstOverlap(clouds, moved.map(padded))).toBeLessThanOrEqual(sky.cellSize);
  });

  it("regrows every puff to its rest shape once the icons are gone", () => {
    const clouds = createClouds(size, context([]).field, sky, mulberry32(11));
    settleClouds(clouds, 200, context(iconsOnClouds(clouds, 3)));
    expect(clouds.some((c) => c.puffs.some((p) => Math.abs(p.dy - p.restDy) > 10))).toBe(true);

    settleClouds(clouds, 200, context([]));

    for (const cloud of clouds) {
      for (const p of cloud.puffs) {
        expect(p.dx).toBeCloseTo(p.restDx, 2);
        expect(p.dy).toBeCloseTo(p.restDy, 2);
        expect(p.scale).toBeCloseTo(1, 3);
      }
    }
  });

  it("flows a whole cloud over or under an icon in one piece, instead of fading puffs", () => {
    const clouds = createClouds(size, context([]).field, sky, mulberry32(11));
    const [icon] = iconsOnClouds(clouds, 1);
    settleClouds(clouds, 200, context([icon]));

    const cloud = clouds[0];
    expect(cloud.flow).not.toBe(0);
    for (const p of cloud.puffs) {
      expect(p.scale).toBeGreaterThan(0.99); // nothing shrinks or fades
      expect(p.dx).toBeCloseTo(p.restDx, 2); // it only moves up or down…
      expect((p.dy - p.restDy) * cloud.flow).toBeGreaterThanOrEqual(-0.01); // …all to the same side
    }
  });

  it("keeps its side while drifting past an icon", () => {
    const ctx = context([{ x: 380, y: 200, ...ICON }]);
    const clouds = createClouds(size, context([]).field, sky, mulberry32(11));
    const cloud = clouds[0];
    cloud.y = 230; // across the icon's middle
    cloud.x = 300;
    const sides = new Set<number>();
    for (let t = 0; t < 400; t++) {
      cloud.x += 0.5;
      stepClouds([cloud], 1 / 30, ctx, false);
      if (cloud.flow !== 0) sides.add(cloud.flow);
    }
    expect(sides.size).toBe(1);
  });

  it("does not move clouds while settling", () => {
    const clouds = createClouds(size, context([]).field, sky, mulberry32(2));
    const before = clouds.map((c) => c.x);
    settleClouds(clouds, 50, context([]));
    expect(clouds.map((c) => c.x)).toEqual(before);
  });
});

describe("drift", () => {
  it("wraps clouds horizontally without losing any", () => {
    const ctx = context([{ x: 40, y: 40, ...ICON }]);
    const clouds = createClouds(size, ctx.field, sky, mulberry32(4));
    const count = clouds.length;
    let wrapped = false;

    // Five simulated minutes at 30 fps: long enough for every cloud to cross the canvas
    for (let i = 0; i < 9000; i++) {
      const before = clouds.map((c) => c.x);
      stepClouds(clouds, 1 / 30, ctx);
      if (clouds.some((c, j) => c.x < before[j])) wrapped = true;

      for (const c of clouds) {
        const e = cloudExtent(c);
        expect(c.x).toBeGreaterThanOrEqual(-e - 50);
        expect(c.x).toBeLessThanOrEqual(size.width + e + 50);
      }
    }

    expect(wrapped).toBe(true);
    expect(clouds.length).toBe(count);
  });

  it("handles a long frame as smoothly as several short ones", () => {
    const ctx = context([{ x: 300, y: 150, ...ICON }]);
    const a = createClouds(size, ctx.field, sky, mulberry32(8));
    const b = createClouds(size, ctx.field, sky, mulberry32(8));

    stepClouds(a, 0.1, ctx);
    for (let i = 0; i < 3; i++) stepClouds(b, 0.1 / 3, ctx);

    expect(a).toEqual(b);
  });
});

describe("wake", () => {
  const still = () => {
    const clouds = createClouds(size, context([]).field, sky, mulberry32(11));
    settleClouds(clouds, 50, context([]));
    return clouds;
  };

  it("sweeps nearby puffs along with a fast icon, and leaves distant ones alone", () => {
    const clouds = still();
    const cloud = clouds[0];
    const near = cloud.puffs[0];
    const mover = { x: cloud.x + near.dx, y: cloud.y + near.dy + 40, vx: 600, vy: 0, radius: 50 };
    const far = { cloud: clouds.find((c) => Math.abs(c.x - mover.x) > 400)!, i: 0 };

    applyWake(clouds, [mover], 1 / 30, sky);

    expect(near.vdx).toBeGreaterThan(50); // picked up the icon's direction
    expect(far.cloud.puffs[far.i].vdx).toBe(0);
  });

  it("ignores slow icons", () => {
    const clouds = still();
    const cloud = clouds[0];
    const p = cloud.puffs[0];
    applyWake(clouds, [{ x: cloud.x + p.dx, y: cloud.y + p.dy, vx: sky.wake.minSpeed / 2, vy: 0, radius: 50 }], 1 / 30, sky);
    expect(p.vdx).toBe(0);
  });

  it("lets the puffs drift back to rest once the icon has passed", () => {
    const clouds = still();
    const cloud = clouds[0];
    const p = cloud.puffs[0];
    for (let i = 0; i < 6; i++) {
      applyWake(clouds, [{ x: cloud.x + p.restDx - 30, y: cloud.y + p.restDy, vx: 900, vy: 0, radius: 50 }], 1 / 30, sky);
      stepClouds(clouds, 1 / 30, context([]), false);
    }
    expect(Math.abs(p.dx - p.restDx)).toBeGreaterThan(5);

    settleClouds(clouds, 200, context([]));
    expect(p.dx).toBeCloseTo(p.restDx, 2);
    expect(p.dy).toBeCloseTo(p.restDy, 2);
  });
});
