import type { Theme } from "./types";

export const sky: Theme = {
  id: "sky",
  name: "Sky",
  palettes: {
    day: {
      skyTop: [104, 176, 236],
      skyBottom: [200, 228, 249],
      sun: [255, 211, 99],
      sunGlow: [255, 236, 173],
      cloud: [255, 255, 255],
      cloudShadow: [213, 228, 243],
      bird: [48, 70, 99],
    },
  },

  cellSize: 12,
  iconPadding: 20,
  density: 1.6,
  pushStrength: 1.15,
  minScale: 0.15,
  stiffness: 40,

  clouds: {
    puffCount: [4, 7],
    backShare: 0.4,
    band: [0.06, 0.82],
    backFade: 0.35,
    back: { radius: [16, 26], speed: [4, 7] },
    front: { radius: [24, 38], speed: [8, 14] },
  },

  sun: { radius: 34, ease: 2.5 },

  birds: { count: [2, 3], speed: [28, 42], size: 7 },
};
