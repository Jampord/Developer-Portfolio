export type Rgb = readonly [r: number, g: number, b: number];

export type Range = readonly [min: number, max: number];

/** Every colour the renderer draws with, for one time of day */
export type Palette = {
  skyTop: Rgb;
  skyBottom: Rgb;
  sun: Rgb;
  sunGlow: Rgb;
  cloud: Rgb;
  cloudShadow: Rgb;
  bird: Rgb;
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
  /** Night arrives with the day/night work; until then the day palette is used for both */
  palettes: { day: Palette; night?: Palette };

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

  sun: {
    radius: number;
    /** How quickly the sun eases to a new spot, in 1/s */
    ease: number;
  };

  birds: {
    count: Range;
    /** Flight speed in px/s */
    speed: Range;
    /** Half the wingspan in px */
    size: number;
  };
};
