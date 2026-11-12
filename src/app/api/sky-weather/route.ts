import { PLACE } from "@/lib/sky-clock";
import { describeWeather } from "@/lib/sky-weather";

// One fetch for every visitor, refreshed at most every 30 minutes. Only San Fernando's
// coordinates go to Open-Meteo; nothing about the visitor does.
export const dynamic = "force-static";
export const revalidate = 1800;

const URL =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${PLACE.latitude}&longitude=${PLACE.longitude}` +
  "&current=temperature_2m,weather_code" +
  `&timezone=${encodeURIComponent(PLACE.timeZone)}`;

type OpenMeteo = { current?: { temperature_2m?: number; weather_code?: number } };

async function currentWeather() {
  try {
    const res = await fetch(URL, { next: { revalidate }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const { current } = (await res.json()) as OpenMeteo;
    if (typeof current?.weather_code !== "number" || typeof current.temperature_2m !== "number") return null;
    return describeWeather(current.weather_code, current.temperature_2m);
  } catch {
    // The sky falls back to partly cloudy, and the caption leaves the weather out
    return null;
  }
}

export async function GET() {
  return Response.json({ weather: await currentWeather() });
}
