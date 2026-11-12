import type { Range, Theme } from "./types";

/** How much cloud the weather brings, relative to the theme */
export type CloudCover = {
  /** Multiplies the cloud density */
  cloudiness: number;
  /** Multiplies every puff's radius */
  puffScale: number;
  /** Multiplies how fast the clouds drift (1 = the theme's speed) */
  wind?: number;
};

const scale = ([min, max]: Range, by: number): Range => [min * by, max * by];

/** The theme with more (or fewer) and bigger (or smaller) clouds; returns the theme itself when nothing changes */
export function withCloudCover(theme: Theme, { cloudiness, puffScale, wind = 1 }: CloudCover): Theme {
  if (cloudiness === 1 && puffScale === 1 && wind === 1) return theme;
  const { back, front } = theme.clouds;
  return {
    ...theme,
    density: theme.density * cloudiness,
    clouds: {
      ...theme.clouds,
      back: { ...back, radius: scale(back.radius, puffScale), speed: scale(back.speed, wind) },
      front: { ...front, radius: scale(front.radius, puffScale), speed: scale(front.speed, wind) },
    },
  };
}
