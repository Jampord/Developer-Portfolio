import { describe, expect, it } from "vitest";
import { sky } from "../../themes/sky";
import { createClouds } from "../clouds";
import { buildField } from "../field";
import { buildGrid } from "../grid";
import { CONDENSE, EVAPORATE, fadeLength, presenceScale, puffDelay, setPresence, startFade, stepPresence } from "../presence";
import { mulberry32 } from "../random";
import type { Cloud } from "../types";

const size = { width: 800, height: 500 };

function makeClouds(): Cloud[] {
  const field = buildField(buildGrid(size, [], { cellSize: sky.cellSize, padding: sky.iconPadding }));
  return createClouds(size, field, sky, mulberry32(3));
}

const presences = (clouds: Cloud[]) => clouds.flatMap((c) => c.puffs.map((p) => p.presence));

/** The puff nearest a cloud's middle, and the one furthest out */
function coreAndEdge(cloud: Cloud) {
  const sorted = [...cloud.puffs].sort((a, b) => Math.abs(a.restDx) - Math.abs(b.restDx));
  return { core: sorted[0], edge: sorted[sorted.length - 1] };
}

describe("presence", () => {
  it("starts every puff fully formed", () => {
    expect(presences(makeClouds()).every((p) => p === 1)).toBe(true);
  });

  it("condenses from nothing to fully formed within its length", () => {
    const clouds = makeClouds();
    setPresence(clouds, 0);
    const fade = startFade(clouds, 1, 10);

    expect(stepPresence(clouds, fade, 10)).toBe(false);
    expect(presences(clouds).every((p) => p === 0)).toBe(true);

    expect(stepPresence(clouds, fade, 10 + fadeLength(1) / 2)).toBe(false);
    const mid = presences(clouds);
    expect(mid.some((p) => p > 0 && p < 1)).toBe(true);

    expect(stepPresence(clouds, fade, 10 + fadeLength(1) + 0.01)).toBe(true);
    expect(presences(clouds).every((p) => p === 1)).toBe(true);
  });

  it("evaporates to nothing within its length, and faster than it condenses", () => {
    const clouds = makeClouds();
    const fade = startFade(clouds, 0, 0);
    expect(stepPresence(clouds, fade, fadeLength(0) + 0.01)).toBe(true);
    expect(presences(clouds).every((p) => p === 0)).toBe(true);
    expect(fadeLength(0)).toBeLessThan(fadeLength(1));
  });

  it("builds a cloud from its core outward, and takes it apart from the edge inward", () => {
    const clouds = makeClouds();
    const cloud = clouds.find((c) => c.puffs.length >= 3)!;
    const i = clouds.indexOf(cloud);
    const { core, edge } = coreAndEdge(cloud);

    expect(puffDelay(i, cloud, core, 1)).toBeLessThan(puffDelay(i, cloud, edge, 1));
    expect(puffDelay(i, cloud, edge, 0)).toBeLessThan(puffDelay(i, cloud, core, 0));
  });

  it("starts clouds at different moments", () => {
    const clouds = makeClouds();
    const starts = clouds.map((c, i) => puffDelay(i, c, coreAndEdge(c).core, 1));
    expect(new Set(starts.map((s) => s.toFixed(3))).size).toBeGreaterThan(1);
    expect(Math.max(...starts)).toBeLessThanOrEqual(CONDENSE.clouds);
  });

  it("reverses from wherever a fade had got to, without a jump", () => {
    const clouds = makeClouds();
    const out = startFade(clouds, 0, 0);
    stepPresence(clouds, out, EVAPORATE.puff);
    const before = presences(clouds);

    const back = startFade(clouds, 1, EVAPORATE.puff);
    stepPresence(clouds, back, EVAPORATE.puff);
    expect(presences(clouds)).toEqual(before);
  });

  it("never draws a forming puff from a point", () => {
    expect(presenceScale(0)).toBeGreaterThan(0.3);
    expect(presenceScale(1)).toBe(1);
  });
});
