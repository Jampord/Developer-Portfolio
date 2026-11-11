export type Rgb = readonly [r: number, g: number, b: number];

export type Range = readonly [min: number, max: number];

/**
 * Every colour the renderer draws with, for one time of day. Day and night use the
 * same keys so the engine can cross-fade between them.
 */
export type Palette = {
  skyTop: Rgb;
  skyBottom: Rgb;
  /** The sun by day, the moon by night */
  orb: Rgb;
  orbGlow: Rgb;
  /** Craters on the moon (only drawn at night) */
  orbDetail: Rgb;
  cloud: Rgb;
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
    /** How far the shadow pass sits below each puff, as a fraction of its radius */
    shadowOffset: number;
    back: CloudLayer;
    front: CloudLayer;
  };

  /** Sun by day, moon by night: same spot, same size */
  orb: {
    radius: number;
    /** How quickly it eases to a new spot, in 1/s */
    ease: number;
    /** Glow size as a multiple of the radius, and its opacity */
    glowScale: number;
    glowAlpha: number;
  };

  birds: {
    count: Range;
    /** Flight speed in px/s */
    speed: Range;
    /** Half the wingspan in px */
    size: number;
    lineWidth: number;
    alpha: number;
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
