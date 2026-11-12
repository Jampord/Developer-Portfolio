import { describe, expect, it } from "vitest";
import { lerpPalette } from "../../engine/renderer";
import { sky } from "../sky";
import { dawn, golden, overcastDay, overcastNight } from "../skyTints";
import { withCloudCover } from "../weather";

const { day, night } = sky.palettes;

describe("Sky palettes", () => {
  it("define the same colours for day and night, so they can cross-fade", () => {
    expect(Object.keys(night).sort()).toEqual(Object.keys(day).sort());
  });

  it("give the dawn and golden-hour tints the same colours too", () => {
    for (const tint of [dawn, golden, overcastDay, overcastNight]) expect(Object.keys(tint).sort()).toEqual(Object.keys(day).sort());
  });

  it("use valid RGB channels", () => {
    for (const palette of [day, night, dawn, golden, overcastDay, overcastNight]) {
      for (const rgb of Object.values(palette)) {
        expect(rgb).toHaveLength(3);
        for (const channel of rgb) {
          expect(Number.isInteger(channel)).toBe(true);
          expect(channel).toBeGreaterThanOrEqual(0);
          expect(channel).toBeLessThanOrEqual(255);
        }
      }
    }
  });
});

describe("lerpPalette", () => {
  it("returns the ends at 0 and 1", () => {
    expect(lerpPalette(day, night, 0)).toEqual(day);
    expect(lerpPalette(day, night, 1)).toEqual(night);
  });

  it("blends every channel halfway at 0.5", () => {
    const mid = lerpPalette(day, night, 0.5);
    for (const key of Object.keys(day) as (keyof typeof day)[]) {
      mid[key].forEach((v, i) => expect(v).toBeCloseTo((day[key][i] + night[key][i]) / 2));
    }
  });
});

describe("withCloudCover", () => {
  it("leaves the theme alone for an ordinary sky", () => {
    expect(withCloudCover(sky, { cloudiness: 1, puffScale: 1 })).toBe(sky);
  });

  it("scales the cloud density and every puff radius", () => {
    const heavy = withCloudCover(sky, { cloudiness: 2, puffScale: 1.5 });
    expect(heavy.density).toBeCloseTo(sky.density * 2);
    expect(heavy.clouds.front.radius[1]).toBeCloseTo(sky.clouds.front.radius[1] * 1.5);
    expect(heavy.clouds.back.radius[0]).toBeCloseTo(sky.clouds.back.radius[0] * 1.5);
    expect(heavy.palettes).toBe(sky.palettes);
  });
});
