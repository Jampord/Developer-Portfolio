import type { Theme } from "./types";

export const sky: Theme = {
  id: "sky",
  name: "Sky",
  palettes: {
    day: {
      skyTop: [62, 138, 218],
      skyBottom: [158, 203, 240],
      skyHaze: [222, 236, 246],
      orb: [255, 214, 110],
      orbGlow: [255, 238, 186],
      orbDetail: [255, 214, 110],
      // Sunlit tops, cool blue-grey undersides
      cloud: [246, 249, 253],
      cloudLight: [255, 255, 255],
      cloudShadow: [186, 204, 226],
      bird: [48, 70, 99],
      star: [255, 255, 255],
    },
    night: {
      skyTop: [7, 13, 34],
      skyBottom: [26, 40, 78],
      skyHaze: [48, 62, 104],
      orb: [238, 240, 228],
      orbGlow: [150, 170, 214],
      orbDetail: [176, 182, 178],
      // Moonlit clouds: muted blue-grey, with a pale edge toward the moon
      cloud: [84, 100, 140],
      cloudLight: [128, 144, 184],
      cloudShadow: [46, 58, 94],
      bird: [48, 70, 99],
      star: [255, 248, 222],
    },
  },

  cellSize: 12,
  iconPadding: 20,
  density: 2.4,
  pushStrength: 1.15,
  minScale: 0.15,
  stiffness: 40,
  modeFade: 0.8,

  clouds: {
    puffCount: [4, 7],
    backShare: 0.4,
    band: [0.06, 0.82],
    backFade: 0.35,
    back: { radius: [16, 26], speed: [4, 7], softness: 0.6, opacity: 0.85 },
    front: { radius: [24, 38], speed: [8, 14], softness: 0.35, opacity: 1 },
  },

  orb: {
    size: 0.07,
    minRadius: 40,
    maxRadius: 90,
    ease: 2.5,
    glowScale: 2.6,
    glowAlpha: 0.55,
    haloScale: 8,
    haloAlpha: 0.22,
  },

  birds: { count: [2, 3], speed: [28, 42], size: 7, lineWidth: 1.6, alpha: 0.85 },

  stars: { density: 7, band: 0.75, radius: [0.6, 1.5], twinkle: [0.8, 2.2] },
};
