import { describe, expect, it } from "vitest";
import { describeWeather, FALLBACK_EFFECT, weatherEffect, weatherText, windFactor } from "../sky-weather";

describe("describeWeather", () => {
  it("maps WMO codes to the sky's kinds of weather", () => {
    expect(describeWeather(0, 30)?.kind).toBe("clear");
    expect(describeWeather(2, 30)?.kind).toBe("partly");
    expect(describeWeather(3, 30)?.kind).toBe("overcast");
    expect(describeWeather(45, 24)?.kind).toBe("fog");
    expect(describeWeather(53, 27)?.kind).toBe("drizzle");
    expect(describeWeather(61, 27)?.kind).toBe("rain");
    expect(describeWeather(81, 27)?.kind).toBe("rain");
    expect(describeWeather(95, 27)?.kind).toBe("storm");
  });

  it("rounds the temperature and wind", () => {
    const w = describeWeather(61, 28.6, 12.4);
    expect(w?.temperature).toBe(29);
    expect(w?.wind).toBe(12);
  });

  it("returns null for codes it doesn't know, or a missing temperature", () => {
    expect(describeWeather(42, 30)).toBeNull();
    expect(describeWeather(0, Number.NaN)).toBeNull();
  });
});

describe("weatherText", () => {
  it("writes the condition and temperature", () => {
    expect(weatherText(describeWeather(61, 28.6, 10)!)).toBe("light rain, 29°C");
  });

  it("mentions the wind only when it's strong", () => {
    expect(weatherText(describeWeather(65, 26, 29)!)).toBe("heavy rain, 26°C");
    expect(weatherText(describeWeather(65, 26, 65)!)).toBe("heavy rain, 26°C, wind 65 km/h");
  });
});

describe("weatherEffect", () => {
  const effect = (code: number, wind = 0) => weatherEffect(describeWeather(code, 28, wind));

  it("is partly cloudy when there's no weather", () => {
    expect(weatherEffect(null)).toEqual(FALLBACK_EFFECT);
    expect(FALLBACK_EFFECT.rain).toBe(0);
  });

  it("rains harder as the code gets heavier", () => {
    expect(effect(51).rain).toBeLessThan(effect(55).rain);
    expect(effect(61).rain).toBeLessThan(effect(63).rain);
    expect(effect(63).rain).toBeLessThan(effect(65).rain);
  });

  it("only rains when it's wet, and only storms have lightning", () => {
    for (const code of [0, 1, 2, 3, 45]) expect(effect(code).rain).toBe(0);
    for (const code of [0, 3, 45, 61, 65, 82]) expect(effect(code).lightning).toBe(0);
    expect(effect(95).lightning).toBeGreaterThan(0);
    expect(effect(99).lightning).toBeGreaterThan(effect(95).lightning);
  });

  it("darkens the sky most for storms", () => {
    expect(effect(95).dark).toBeGreaterThan(effect(65).dark);
    expect(effect(3).dark).toBe(0);
  });

  it("lays fog low in fog, and only lightly otherwise", () => {
    expect(effect(45).fog).toBe(1);
    expect(effect(0).fog).toBe(0);
    expect(effect(63).fog).toBeLessThan(0.5);
  });

  it("speeds the sky up with the wind", () => {
    expect(windFactor(5)).toBe(1);
    expect(windFactor(60)).toBeCloseTo(2.5);
    expect(windFactor(200)).toBe(5);
    expect(effect(63, 90).wind).toBeGreaterThan(effect(63, 10).wind);
  });
});
