import { describe, expect, it } from "vitest";
import { describeWeather, WEATHER_EFFECTS, weatherText } from "../sky-weather";

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

  it("rounds the temperature and writes a caption", () => {
    const w = describeWeather(61, 28.6);
    expect(w).not.toBeNull();
    expect(weatherText(w!)).toBe("light rain, 29°C");
  });

  it("returns null for codes it doesn't know, or a missing temperature", () => {
    expect(describeWeather(42, 30)).toBeNull();
    expect(describeWeather(0, Number.NaN)).toBeNull();
  });
});

describe("WEATHER_EFFECTS", () => {
  it("never flashes: storms are drawn as heavy rain", () => {
    expect(WEATHER_EFFECTS.storm.rain).toBe(1);
    expect(Object.keys(WEATHER_EFFECTS.storm).sort()).toEqual(Object.keys(WEATHER_EFFECTS.rain).sort());
  });

  it("only rains when the weather is wet", () => {
    for (const kind of ["clear", "partly", "overcast", "fog"] as const) expect(WEATHER_EFFECTS[kind].rain).toBe(0);
    for (const kind of ["drizzle", "rain", "storm"] as const) expect(WEATHER_EFFECTS[kind].rain).toBeGreaterThan(0);
  });
});
