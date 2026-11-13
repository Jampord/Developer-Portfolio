import type { Cloud, Puff } from "./types";

/**
 * Clouds condensing out of clear sky, or evaporating back into it. Each puff has a presence from
 * 0 (not there) to 1 (fully formed), which the renderer turns into its size and opacity.
 *
 * Condensing, each cloud starts at its own moment and builds from its core outward, the way a
 * cumulus heaps up. Evaporating runs the other way: the ragged edges go first and the core last.
 */
export type Fade = {
  /** 1 to condense, 0 to evaporate */
  to: 0 | 1;
  /** When it started, in the engine's seconds */
  start: number;
  /** Where each puff was when it started (a fade can reverse one still under way) */
  from: WeakMap<Puff, number>;
};

type Timing = {
  /** How long one puff takes, in s */
  puff: number;
  /** The spread of start times across clouds, in s */
  clouds: number;
  /** The extra wait from a cloud's core to its edge (or edge to core), in s */
  edge: number;
};

/** About 1.2 s from the first puff to the last */
export const CONDENSE: Timing = { puff: 0.6, clouds: 0.4, edge: 0.2 };
/** About 0.9 s */
export const EVAPORATE: Timing = { puff: 0.45, clouds: 0.3, edge: 0.15 };

/** The longest a fade can take, in s */
export const fadeLength = (to: 0 | 1) => {
  const t = to === 1 ? CONDENSE : EVAPORATE;
  return t.puff + t.clouds + t.edge;
};

/** A repeatable 0–1 value per cloud, so the stagger needs no stored state */
function cloudHash(i: number): number {
  const v = Math.sin(i * 91.345 + 7.13) * 43758.5453;
  return v - Math.floor(v);
}

/** 0 at a cloud's core, 1 at its outermost puff */
function edgeness(cloud: Cloud, p: Puff): number {
  let reach = 0;
  for (const q of cloud.puffs) reach = Math.max(reach, Math.abs(q.restDx));
  return reach > 0 ? Math.abs(p.restDx) / reach : 0;
}

/** When a puff starts moving, in s after the fade began */
export function puffDelay(cloudIndex: number, cloud: Cloud, p: Puff, to: 0 | 1): number {
  const t = to === 1 ? CONDENSE : EVAPORATE;
  const e = edgeness(cloud, p);
  return cloudHash(cloudIndex) * t.clouds + (to === 1 ? e : 1 - e) * t.edge;
}

/** Condensing: a slow start and a soft landing, so a cloud is seen heaping up rather than popping in */
const easeInOut = (u: number) => u * u * (3 - 2 * u);
/** Evaporating: it lingers, then thins away */
const easeIn = (u: number) => u * u;

/**
 * Set every puff's presence for this moment of the fade. Returns true once every puff has
 * arrived, so the engine can drop the fade.
 */
export function stepPresence(clouds: Cloud[], fade: Fade, time: number): boolean {
  const t = fade.to === 1 ? CONDENSE : EVAPORATE;
  const ease = fade.to === 1 ? easeInOut : easeIn;
  let done = true;
  clouds.forEach((cloud, i) => {
    for (const p of cloud.puffs) {
      // A puff laid out after the fade began starts from where the fade itself started
      const from = fade.from.get(p) ?? 1 - fade.to;
      const u = Math.min(1, Math.max(0, (time - fade.start - puffDelay(i, cloud, p, fade.to)) / t.puff));
      if (u < 1) done = false;
      p.presence = from + (fade.to - from) * ease(u);
    }
  });
  return done;
}

/** Start a fade toward `to`, from wherever each puff is now */
export function startFade(clouds: Cloud[], to: 0 | 1, start: number): Fade {
  const from = new WeakMap<Puff, number>();
  for (const cloud of clouds) for (const p of cloud.puffs) from.set(p, p.presence);
  return { to, start, from };
}

/** Put every puff straight at `presence` (reduced motion, or a sky that isn't running) */
export function setPresence(clouds: Cloud[], presence: number): void {
  for (const cloud of clouds) for (const p of cloud.puffs) p.presence = presence;
}

/** A puff at this presence is drawn at this share of its size: it grows out of a small wisp, not from a point */
export const presenceScale = (presence: number) => 0.45 + 0.55 * presence;
