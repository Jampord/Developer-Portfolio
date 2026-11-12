import { describe, expect, it } from "vitest";
import { moonArc, moonPhase, placeTime, skyTime, sunArc, sunTimes } from "../sky-clock";

/** A Philippine local time (UTC+8) as UTC ms */
const ph = (y: number, mo: number, d: number, h: number, mi = 0) => Date.UTC(y, mo - 1, d, h - 8, mi);
const MIN = 60_000;

describe("sunTimes (San Fernando, Pampanga)", () => {
  it("matches published times around the June solstice (about 5:28 AM and 6:28 PM)", () => {
    const { sunrise, sunset } = sunTimes(ph(2026, 6, 21, 12));
    expect(Math.abs(sunrise - ph(2026, 6, 21, 5, 28))).toBeLessThan(6 * MIN);
    expect(Math.abs(sunset - ph(2026, 6, 21, 18, 28))).toBeLessThan(6 * MIN);
  });

  it("matches published times around the December solstice (about 6:19 AM and 5:31 PM)", () => {
    const { sunrise, sunset } = sunTimes(ph(2026, 12, 21, 12));
    expect(Math.abs(sunrise - ph(2026, 12, 21, 6, 19))).toBeLessThan(6 * MIN);
    expect(Math.abs(sunset - ph(2026, 12, 21, 17, 31))).toBeLessThan(6 * MIN);
  });

  it("uses the Philippine day, even late at night", () => {
    const a = sunTimes(ph(2026, 3, 10, 0, 5));
    const b = sunTimes(ph(2026, 3, 10, 23, 55));
    expect(a.sunrise).toBe(b.sunrise);
  });
});

describe("skyTime", () => {
  const { sunrise, sunset } = sunTimes(ph(2026, 9, 1, 12));

  it("is night before sunrise and after sunset", () => {
    expect(skyTime(sunrise - MIN).night).toBe(true);
    expect(skyTime(sunset + MIN).night).toBe(true);
    expect(skyTime(ph(2026, 9, 1, 12)).night).toBe(false);
  });

  it("starts the day at full dawn and fades it out over an hour", () => {
    expect(skyTime(sunrise + MIN).dawn).toBeGreaterThan(0.95);
    expect(skyTime(sunrise + 30 * MIN).dawn).toBeCloseTo(0.5, 1);
    expect(skyTime(sunrise + 61 * MIN).dawn).toBe(0);
  });

  it("builds up to golden hour before sunset", () => {
    expect(skyTime(sunset - 80 * MIN).golden).toBe(0);
    expect(skyTime(sunset - 30 * MIN).golden).toBeGreaterThan(0.5);
    expect(skyTime(sunset - MIN).golden).toBeGreaterThan(0.95);
  });
});

describe("moonPhase", () => {
  it("is new at the reference new moon and full half a cycle later", () => {
    expect(moonPhase(Date.UTC(2000, 0, 6, 18, 14))).toBeCloseTo(0, 5);
    expect(moonPhase(Date.UTC(2000, 0, 6, 18, 14) + 14.765 * 86_400_000)).toBeCloseTo(0.5, 3);
  });

  it("puts a known full moon (2024-04-23 23:49 UTC) at about half", () => {
    expect(Math.abs(moonPhase(Date.UTC(2024, 3, 23, 23, 49)) - 0.5)).toBeLessThan(0.03);
  });

  it("stays between 0 and 1 before the reference date too", () => {
    const p = moonPhase(Date.UTC(1990, 5, 1));
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThan(1);
  });
});

describe("placeTime", () => {
  it("formats the time in Philippine time", () => {
    expect(placeTime(ph(2026, 11, 12, 21, 14))).toBe("9:14 PM");
  });
});

describe("sunArc", () => {
  const { sunrise, sunset } = sunTimes(ph(2026, 9, 1, 12));

  it("rises on the left, peaks halfway through the day, and sets on the right", () => {
    expect(sunArc(sunrise + MIN)).toEqual({ progress: expect.closeTo(0, 2) });
    expect(sunArc((sunrise + sunset) / 2)).toEqual({ progress: expect.closeTo(0.5, 5) });
    expect(sunArc(sunset - MIN)).toEqual({ progress: expect.closeTo(1, 2) });
  });

  it("is below the horizon at night", () => {
    expect(sunArc(sunset + MIN)).toBe("below");
    expect(sunArc(sunrise - MIN)).toBe("below");
  });
});

describe("moonArc", () => {
  const HOUR = 60 * MIN;
  // A known full moon (2024-04-23 23:49 UTC, 07:49 on the 24th in the Philippines)
  const fullMoonDay = ph(2024, 4, 24, 12);
  // A known new moon (2024-05-08 03:22 UTC)
  const newMoonDay = ph(2024, 5, 8, 12);

  it("puts a full moon high around midnight, and below the horizon at noon", () => {
    const night = moonArc(ph(2024, 4, 24, 0, 30));
    expect(night).not.toBe("below");
    if (night !== "below") expect(Math.abs(night.progress - 0.5)).toBeLessThan(0.15);
    expect(moonArc(fullMoonDay)).toBe("below");
  });

  it("keeps a new moon up with the sun, so it's below the horizon at midnight", () => {
    expect(moonArc(ph(2024, 5, 8, 0))).toBe("below");
    expect(moonArc(newMoonDay)).not.toBe("below");
  });

  it("is up for about half a day", () => {
    let up = 0;
    for (let t = fullMoonDay; t < fullMoonDay + 24 * HOUR; t += 10 * MIN) if (moonArc(t) !== "below") up++;
    expect(up * 10).toBeGreaterThan(11 * 60);
    expect(up * 10).toBeLessThan(13.5 * 60);
  });
});
