export type Rgb = readonly [r: number, g: number, b: number];

export type Range = readonly [min: number, max: number];

/**
 * Every colour the renderer draws with, for one time of day. Day and night use the
 * same keys so the engine can cross-fade between them.
 */
export type Palette = {
  skyTop: Rgb;
  skyBottom: Rgb;
  /** Pale haze at the very bottom of the sky, toward the horizon */
  skyHaze: Rgb;
  /** The sun by day, the moon by night */
  orb: Rgb;
  orbGlow: Rgb;
  /** Craters on the moon (only drawn at night) */
  orbDetail: Rgb;
  cloud: Rgb;
  /** The side of a cloud facing the sun or moon */
  cloudLight: Rgb;
  /** Undersides, away from the light */
  cloudShadow: Rgb;
  /** Only drawn by day */
  bird: Rgb;
  /** Only drawn at night */
  star: Rgb;
};

type CloudLayer = {
  /** Base puff radius in px */
  radius: Range;
  /** Drift speed in px/s */
  speed: Range;
  /** Share of each puff's radius that fades out at its edge (0 = hard edge) */
  softness: number;
  opacity: number;
};

export type Theme = {
  id: string;
  name: string;
  palettes: { day: Palette; night: Palette };

  /** Occupancy grid cell size in px */
  cellSize: number;
  /** Space kept clear around each icon, in px */
  iconPadding: number;
  /** Clouds per 100,000 px² of canvas */
  density: number;
  /** How far puffs are pushed out of the way (1 = just clear) */
  pushStrength: number;
  /** Smallest a squeezed puff shrinks to, as a fraction of its size (puffs resting inside an icon's padding vanish) */
  minScale: number;
  /** Spring stiffness for reflow, in 1/s² (higher = snappier) */
  stiffness: number;
  /** Day ↔ night cross-fade length, in seconds */
  modeFade: number;

  clouds: {
    puffCount: Range;
    /** Share of clouds drawn in the back layer (smaller, slower, fainter) */
    backShare: number;
    /** Vertical band clouds are placed in, as fractions of the canvas height */
    band: Range;
    /** How much back clouds fade toward the sky colour (0–1) */
    backFade: number;
    back: CloudLayer;
    front: CloudLayer;
  };

  /** Sun by day, moon by night: same spot, same size */
  orb: {
    /** Radius as a fraction of the canvas's shorter side, kept within min and max (px) */
    size: number;
    minRadius: number;
    maxRadius: number;
    /** How quickly it eases to a new spot, in 1/s */
    ease: number;
    /** Soft glow around the disc: its size as a multiple of the radius, and its opacity */
    glowScale: number;
    glowAlpha: number;
    /** A wide, faint brightening of the sky around the sun (day only), same units */
    haloScale: number;
    haloAlpha: number;
  };

  birds: {
    count: Range;
    /** Flight speed in px/s */
    speed: Range;
    /** Half the wingspan in px */
    size: number;
    lineWidth: number;
    alpha: number;
    /** Birds that follow each lead bird in a loose V */
    flock: Range;
    /** Gap between birds in a flock, as a multiple of the wingspan */
    spacing: number;
  };

  /** A hot-air balloon that drifts across the day sky, as they do over Pampanga each February */
  balloon: {
    /** Envelope radius as a fraction of the canvas's shorter side, kept within min and max (px) */
    size: number;
    minRadius: number;
    maxRadius: number;
    /** Drift speed in px/s */
    speed: Range;
    /** The band it floats in, as fractions of the canvas height */
    band: Range;
    /** How far it bobs up and down, in px */
    bob: number;
  };

  /** Shooting stars in the night sky */
  meteors: {
    /** One may fall in each stretch of this many seconds */
    every: number;
    /** The chance that a stretch has one (0–1) */
    chance: number;
    /** How long one lasts, in seconds */
    duration: number;
    /** How far it travels, as a fraction of the canvas's shorter side */
    travel: number;
  };

  stars: {
    /** Stars per 100,000 px² of canvas */
    density: number;
    /** Stars sit in the top part of the sky, as a fraction of the canvas height */
    band: number;
    radius: Range;
    /** Twinkle speed in radians per second */
    twinkle: Range;
  };
};
