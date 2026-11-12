import { describe, expect, it } from "vitest";
import { lerpPalette } from "../../engine/renderer";
import { sky } from "../sky";
import { dawn, golden } from "../skyTints";

const { day, night } = sky.palettes;

describe("Sky palettes", () => {
  it("define the same colours for day and night, so they can cross-fade", () => {
    expect(Object.keys(night).sort()).toEqual(Object.keys(day).sort());
  });

  it("give the dawn and golden-hour tints the same colours too", () => {
    for (const tint of [dawn, golden]) expect(Object.keys(tint).sort()).toEqual(Object.keys(day).sort());
  });

  it("use valid RGB channels", () => {
    for (const palette of [day, night, dawn, golden]) {
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
