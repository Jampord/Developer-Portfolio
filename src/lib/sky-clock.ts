// The real sky over San Fernando, Pampanga: sunrise and sunset, how far into dawn or golden
// hour it is, and the moon's phase. Pure functions of a timestamp, so they're easy to test.

export const PLACE = {
  latitude: 15.0286,
  longitude: 120.6898,
  /** Philippine time is UTC+8 all year (no daylight saving) */
  utcOffsetHours: 8,
  timeZone: "Asia/Manila",
} as const;

/**
 * Sunrise and sunset (UTC ms) for San Fernando, Pampanga, on the Philippine calendar day that
 * contains `ms`. The standard sunrise equation, good to a minute or two.
 *
 * Self-contained on purpose (no outside references): the pre-paint theme script embeds its
 * source with toString(), so the first paint already matches the clock.
 */
export function sunTimes(ms: number): { sunrise: number; sunset: number } {
  const DAY = 86_400_000;
  const LAT = 15.0286;
  const LON = 120.6898;
  const OFFSET = 8 * 3_600_000;
  const rad = Math.PI / 180;

  // Days from 2000-01-01 (day 10957 of the Unix epoch) to this Philippine day, then mean solar noon here
  const n = Math.floor((ms + OFFSET) / DAY) - 10957;
  const jStar = n + 0.0008 - LON / 360;

  const m = (357.5291 + 0.98560028 * jStar) % 360;
  const c = 1.9148 * Math.sin(m * rad) + 0.02 * Math.sin(2 * m * rad) + 0.0003 * Math.sin(3 * m * rad);
  const lambda = (m + c + 180 + 102.9372) % 360;
  // Solar transit, then the hour angle where the sun's upper edge meets the horizon
  const transit = 2451545 + jStar + 0.0053 * Math.sin(m * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const sinDec = Math.sin(lambda * rad) * Math.sin(23.4397 * rad);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.sin(-0.833 * rad) - Math.sin(LAT * rad) * sinDec) / (Math.cos(LAT * rad) * cosDec);
  const h = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad;

  const toMs = (julian: number) => (julian - 2440587.5) * DAY;
  return { sunrise: toMs(transit - h / 360), sunset: toMs(transit + h / 360) };
}

export type SkyTime = {
  /** Between sunset and the next sunrise */
  night: boolean;
  /** 1 at sunrise, fading to 0 an hour later */
  dawn: number;
  /** 0 until 75 minutes before sunset, rising to 1 at sunset */
  golden: number;
};

const DAWN_MS = 60 * 60_000;
const GOLDEN_MS = 75 * 60_000;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function skyTime(ms: number): SkyTime {
  const { sunrise, sunset } = sunTimes(ms);
  const night = ms < sunrise || ms >= sunset;
  if (night) return { night, dawn: 0, golden: 0 };
  return {
    night,
    dawn: clamp01(1 - (ms - sunrise) / DAWN_MS),
    golden: clamp01(1 - (sunset - ms) / GOLDEN_MS),
  };
}

/** Length of a lunar cycle in ms, and a known new moon (2000-01-06 18:14 UTC) */
const SYNODIC_MS = 29.530588853 * 86_400_000;
const NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

/** 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter */
export function moonPhase(ms: number): number {
  const cycles = (ms - NEW_MOON_MS) / SYNODIC_MS;
  return cycles - Math.floor(cycles);
}

/** The time in San Fernando, Pampanga, e.g. "9:14 PM" */
export function placeTime(ms: number): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: PLACE.timeZone, hour: "numeric", minute: "2-digit" }).format(ms);
}

/** How far across the sky a body is: 0 rising in the east (left), 0.5 highest, 1 setting in the west (right) */
export type SkyArc = { progress: number } | "below";

/** The sun's place on its arc between Pampanga sunrise and sunset, or "below" the horizon */
export function sunArc(ms: number): SkyArc {
  const { sunrise, sunset } = sunTimes(ms);
  if (ms < sunrise || ms >= sunset) return "below";
  return { progress: (ms - sunrise) / (sunset - sunrise) };
}

/** The moon is up for about half a day either side of crossing the sky's highest point */
const MOON_HALF_SPAN = 6.2 * 3_600_000;

/**
 * The moon's place on its arc, or "below" the horizon. An approximation good to about an hour: the
 * moon crosses the sky's highest point at solar noon plus its phase of a day (with the sun at new
 * moon, at midnight when full), so it rises about 50 minutes later each day.
 */
export function moonArc(ms: number): SkyArc {
  const day = 86_400_000;
  const { sunrise, sunset } = sunTimes(ms);
  const noon = (sunrise + sunset) / 2;
  const offset = moonPhase(ms) * day;
  for (const shift of [-day, 0, day]) {
    const transit = noon + offset + shift;
    const rise = transit - MOON_HALF_SPAN;
    if (ms >= rise && ms < transit + MOON_HALF_SPAN) return { progress: (ms - rise) / (2 * MOON_HALF_SPAN) };
  }
  return "below";
}
