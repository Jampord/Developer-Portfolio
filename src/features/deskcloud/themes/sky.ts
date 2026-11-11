import type { Theme } from "./types";

export const sky: Theme = {
  id: "sky",
  name: "Sky",
  palettes: {
    day: {
      skyTop: [104, 176, 236],
      skyBottom: [200, 228, 249],
      orb: [255, 211, 99],
      orbGlow: [255, 236, 173],
      orbDetail: [255, 211, 99],
      cloud: [255, 255, 255],
      cloudShadow: [213, 228, 243],
      bird: [48, 70, 99],
      star: [255, 255, 255],
    },
    night: {
      skyTop: [11, 20, 46],
      skyBottom: [36, 54, 96],
      orb: [236, 238, 224],
      orbGlow: [150, 170, 214],
      orbDetail: [206, 210, 200],
      // Moonlit clouds: muted blue-grey with a deeper shadow
      cloud: [96, 112, 152],
      cloudShadow: [64, 78, 118],
      bird: [48, 70, 99],
      star: [255, 248, 222],
    },
  },

  cellSize: 12,
  iconPadding: 20,
  density: 1.6,
  pushStrength: 1.15,
  minScale: 0.15,
  stiffness: 40,
  modeFade: 0.8,

  clouds: {
    puffCount: [4, 7],
    backShare: 0.4,
    band: [0.06, 0.82],
    backFade: 0.35,
    shadowOffset: 0.18,
    back: { radius: [16, 26], speed: [4, 7] },
    front: { radius: [24, 38], speed: [8, 14] },
  },

  orb: { radius: 34, ease: 2.5, glowScale: 1.7, glowAlpha: 0.35 },

  birds: { count: [2, 3], speed: [28, 42], size: 7, lineWidth: 1.6, alpha: 0.85 },

  stars: { density: 7, band: 0.75, radius: [0.6, 1.5], twinkle: [0.8, 2.2] },
};
