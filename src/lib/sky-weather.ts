// The weather over San Fernando, Pampanga, as the hero's sky shows it. Codes are WMO weather
// interpretation codes, as returned by Open-Meteo.

export type WeatherKind = "clear" | "partly" | "overcast" | "fog" | "drizzle" | "rain" | "storm";

export type SkyWeather = {
  code: number;
  /** °C, rounded */
  temperature: number;
  /** Wind speed at 10 m, km/h, rounded */
  wind: number;
  kind: WeatherKind;
  /** Lower case, for the caption: "light rain" */
  label: string;
};

/** How the weather changes the sky */
export type WeatherEffect = {
  /** Multiplies the theme's cloud density */
  cloudiness: number;
  /** Multiplies every puff's radius */
  puffScale: number;
  /** 0–1: how far the colours move toward the grey overcast palettes */
  grey: number;
  /** 0–1: how much further they darken toward the storm palettes */
  dark: number;
  /** 0–1: how much cloud hides the sun or moon */
  sunHidden: number;
  /** 0–1: how many rain streaks fall (none with reduced motion) */
  rain: number;
  /** 0–1: how often lightning strikes; 1 is about every 6 seconds (none with reduced motion) */
  lightning: number;
  /** 0–1: a low band of fog over the bottom of the sky */
  fog: number;
  /** Multiplies cloud drift and slants the rain: 1 in light air, up to 5 in a typhoon */
  wind: number;
};

const SKIES: Record<WeatherKind, Omit<WeatherEffect, "rain" | "lightning" | "wind">> = {
  clear: { cloudiness: 0.4, puffScale: 0.9, grey: 0, dark: 0, sunHidden: 0, fog: 0 },
  partly: { cloudiness: 1, puffScale: 1, grey: 0, dark: 0, sunHidden: 0, fog: 0 },
  overcast: { cloudiness: 1.9, puffScale: 1.25, grey: 0.7, dark: 0, sunHidden: 0.75, fog: 0.15 },
  fog: { cloudiness: 1.6, puffScale: 1.2, grey: 0.6, dark: 0, sunHidden: 0.6, fog: 1 },
  drizzle: { cloudiness: 1.9, puffScale: 1.25, grey: 0.75, dark: 0, sunHidden: 0.8, fog: 0.25 },
  rain: { cloudiness: 2, puffScale: 1.3, grey: 0.8, dark: 0.25, sunHidden: 0.85, fog: 0.3 },
  storm: { cloudiness: 2.1, puffScale: 1.35, grey: 1, dark: 0.85, sunHidden: 1, fog: 0.3 },
};

type CodeInfo = { kind: WeatherKind; label: string; rain?: number; lightning?: number };

const CODES: Record<number, CodeInfo> = {
  0: { kind: "clear", label: "clear" },
  1: { kind: "clear", label: "mostly clear" },
  2: { kind: "partly", label: "partly cloudy" },
  3: { kind: "overcast", label: "overcast" },
  45: { kind: "fog", label: "fog" },
  48: { kind: "fog", label: "fog" },
  51: { kind: "drizzle", label: "light drizzle", rain: 0.2 },
  53: { kind: "drizzle", label: "drizzle", rain: 0.3 },
  55: { kind: "drizzle", label: "heavy drizzle", rain: 0.45 },
  56: { kind: "drizzle", label: "freezing drizzle", rain: 0.3 },
  57: { kind: "drizzle", label: "freezing drizzle", rain: 0.45 },
  61: { kind: "rain", label: "light rain", rain: 0.45 },
  63: { kind: "rain", label: "rain", rain: 0.7 },
  65: { kind: "rain", label: "heavy rain", rain: 1 },
  66: { kind: "rain", label: "freezing rain", rain: 0.5 },
  67: { kind: "rain", label: "freezing rain", rain: 0.8 },
  71: { kind: "overcast", label: "light snow" },
  73: { kind: "overcast", label: "snow" },
  75: { kind: "overcast", label: "heavy snow" },
  77: { kind: "overcast", label: "snow grains" },
  80: { kind: "rain", label: "light showers", rain: 0.5 },
  81: { kind: "rain", label: "showers", rain: 0.75 },
  82: { kind: "rain", label: "heavy showers", rain: 1 },
  85: { kind: "overcast", label: "snow showers" },
  86: { kind: "overcast", label: "snow showers" },
  95: { kind: "storm", label: "thunderstorm", rain: 0.85, lightning: 0.6 },
  96: { kind: "storm", label: "thunderstorm with hail", rain: 1, lightning: 1 },
  99: { kind: "storm", label: "thunderstorm with hail", rain: 1, lightning: 1 },
};

/** A weather code, temperature and wind as the sky shows them, or null for a code it doesn't know */
export function describeWeather(code: number, temperature: number, wind = 0): SkyWeather | null {
  const info = CODES[code];
  if (!info || !Number.isFinite(temperature)) return null;
  return {
    code,
    temperature: Math.round(temperature),
    wind: Number.isFinite(wind) ? Math.max(0, Math.round(wind)) : 0,
    kind: info.kind,
    label: info.label,
  };
}

/** Wind speed (km/h) to a drift multiplier: 1 up to a breeze, rising to 5 at typhoon strength (~120 km/h) */
export function windFactor(kmh: number): number {
  return Math.min(5, Math.max(1, kmh / 24));
}

/** What the sky looks like for this weather; null (unknown, or not fetched yet) is partly cloudy */
export function weatherEffect(weather: SkyWeather | null): WeatherEffect {
  if (!weather) return FALLBACK_EFFECT;
  const info = CODES[weather.code];
  return {
    ...SKIES[weather.kind],
    rain: info?.rain ?? 0,
    lightning: info?.lightning ?? 0,
    wind: windFactor(weather.wind),
  };
}

export const FALLBACK_EFFECT: WeatherEffect = { ...SKIES.partly, rain: 0, lightning: 0, wind: 1 };

/** Winds from this speed (km/h) are mentioned in the caption */
const NOTABLE_WIND = 30;

/** "light rain, 29°C" or "heavy rain, 26°C, wind 65 km/h" */
export function weatherText(w: SkyWeather): string {
  const wind = w.wind >= NOTABLE_WIND ? `, wind ${w.wind} km/h` : "";
  return `${w.label}, ${w.temperature}°C${wind}`;
}
