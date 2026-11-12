import type { Palette } from "./types";
import { sky } from "./sky";

// Day palettes for the edges of the day. The hero blends the Sky theme's day palette toward
// these as dawn fades and golden hour builds; birds and stars keep the day colours.

/** Just after sunrise: a soft pink haze and warm-edged clouds */
export const dawn: Palette = {
  ...sky.palettes.day,
  skyTop: [96, 140, 210],
  skyBottom: [236, 196, 208],
  skyHaze: [255, 222, 206],
  orb: [255, 200, 120],
  orbGlow: [255, 222, 190],
  orbDetail: [255, 200, 120],
  cloud: [252, 240, 240],
  cloudLight: [255, 232, 214],
  cloudShadow: [200, 184, 204],
};

/** The last hour before sunset: an amber horizon, a low orange sun and gold-lit clouds */
export const golden: Palette = {
  ...sky.palettes.day,
  skyTop: [74, 120, 196],
  skyBottom: [244, 196, 150],
  skyHaze: [255, 214, 160],
  orb: [255, 176, 84],
  orbGlow: [255, 206, 140],
  orbDetail: [255, 176, 84],
  cloud: [255, 236, 220],
  cloudLight: [255, 226, 180],
  cloudShadow: [196, 160, 170],
};
