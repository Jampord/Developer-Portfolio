// The weather over San Fernando, Pampanga, as the hero's sky shows it. Codes are WMO weather
// interpretation codes, as returned by Open-Meteo.

export type WeatherKind = "clear" | "partly" | "overcast" | "fog" | "drizzle" | "rain" | "storm";

export type SkyWeather = {
  code: number;
  /** °C, rounded */
  temperature: number;
  kind: WeatherKind;
  /** Lower case, for the caption: "light rain" */
  label: string;
};

/** How a kind of weather changes the sky */
export type WeatherEffect = {
  /** Multiplies the theme's cloud density */
  cloudiness: number;
  /** Multiplies every puff's radius */
  puffScale: number;
  /** 0–1: how far the colours move toward the grey overcast palettes */
  grey: number;
  /** 0–1: how many rain streaks fall (none with reduced motion) */
  rain: number;
  /** 0–1: how much the clouds hide the sun or moon */
  sunHidden: number;
};

export const WEATHER_EFFECTS: Record<WeatherKind, WeatherEffect> = {
  clear: { cloudiness: 0.4, puffScale: 0.9, grey: 0, rain: 0, sunHidden: 0 },
  partly: { cloudiness: 1, puffScale: 1, grey: 0, rain: 0, sunHidden: 0 },
  overcast: { cloudiness: 1.9, puffScale: 1.25, grey: 0.7, rain: 0, sunHidden: 0.75 },
  fog: { cloudiness: 1.6, puffScale: 1.2, grey: 0.6, rain: 0, sunHidden: 0.6 },
  drizzle: { cloudiness: 1.9, puffScale: 1.25, grey: 0.75, rain: 0.35, sunHidden: 0.8 },
  rain: { cloudiness: 2, puffScale: 1.3, grey: 0.8, rain: 0.7, sunHidden: 0.85 },
  // Drawn as heavy rain: no lightning, since flashing is an accessibility risk
  storm: { cloudiness: 2.1, puffScale: 1.35, grey: 0.9, rain: 1, sunHidden: 0.9 },
};

/** What the sky looks like when the weather can't be fetched */
export const FALLBACK_EFFECT = WEATHER_EFFECTS.partly;

const CODES: Record<number, readonly [WeatherKind, string]> = {
  0: ["clear", "clear"],
  1: ["clear", "mostly clear"],
  2: ["partly", "partly cloudy"],
  3: ["overcast", "overcast"],
  45: ["fog", "fog"],
  48: ["fog", "fog"],
  51: ["drizzle", "light drizzle"],
  53: ["drizzle", "drizzle"],
  55: ["drizzle", "heavy drizzle"],
  56: ["drizzle", "freezing drizzle"],
  57: ["drizzle", "freezing drizzle"],
  61: ["rain", "light rain"],
  63: ["rain", "rain"],
  65: ["rain", "heavy rain"],
  66: ["rain", "freezing rain"],
  67: ["rain", "freezing rain"],
  71: ["overcast", "light snow"],
  73: ["overcast", "snow"],
  75: ["overcast", "heavy snow"],
  77: ["overcast", "snow grains"],
  80: ["rain", "light showers"],
  81: ["rain", "showers"],
  82: ["rain", "heavy showers"],
  85: ["overcast", "snow showers"],
  86: ["overcast", "snow showers"],
  95: ["storm", "thunderstorm"],
  96: ["storm", "thunderstorm with hail"],
  99: ["storm", "thunderstorm with hail"],
};

/** A weather code and temperature as the sky shows them, or null for a code it doesn't know */
export function describeWeather(code: number, temperature: number): SkyWeather | null {
  const entry = CODES[code];
  if (!entry || !Number.isFinite(temperature)) return null;
  return { code, temperature: Math.round(temperature), kind: entry[0], label: entry[1] };
}

/** "light rain, 29°C" */
export const weatherText = (w: SkyWeather) => `${w.label}, ${w.temperature}°C`;
