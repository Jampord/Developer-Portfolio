import type { Palette, Rgb, Theme } from "../themes/types";
import { flapStrength, type Accents, type Balloon } from "./accents";
import { SKY_MID } from "./skyStops";
import type { Cloud, Size } from "./types";

export type Scene = {
  size: Size;
  /** Already blended for the current point in the day → night fade */
  palette: Palette;
  /** 0 = day, 1 = night (eased): fades stars and moon craters in, birds and the sun's halo out */
  night: number;
  clouds: Cloud[];
  accents: Accents;
  theme: Theme;
  /** The moon's phase, 0–1 (0 new, 0.5 full); null or missing draws a full moon */
  moonPhase?: number | null;
  /** 0–1: how many rain streaks fall */
  rain?: number;
  /** 0–1: how much cloud hides the sun or moon */
  sunHidden?: number;
  /** 0–1: how often lightning strikes */
  lightning?: number;
  /** 0–1: a low band of fog */
  fog?: number;
  /** Wind multiplier for the rain's slant (1 = light air) */
  wind?: number;
  /** Seconds since the scene started, for the falling rain */
  time?: number;
  /** True when nothing may move (reduced motion): no shooting stars */
  still?: boolean;
};

const TAU = Math.PI * 2;

/**
 * The moon's dark seas (maria) roughly where they really are on the near side, north up: centre
 * x, y, radii x, y as fractions of the moon's radius, and how dark. They overlap and blur into the
 * familiar face instead of reading as craters.
 */
const MARIA: readonly (readonly [number, number, number, number, number])[] = [
  [-0.5, 0.02, 0.3, 0.46, 0.5], // Oceanus Procellarum
  [-0.26, -0.3, 0.3, 0.24, 0.65], // Mare Imbrium
  [0.02, -0.58, 0.36, 0.08, 0.4], // Mare Frigoris
  [0.12, -0.28, 0.17, 0.15, 0.65], // Mare Serenitatis
  [0.26, -0.04, 0.22, 0.18, 0.6], // Mare Tranquillitatis
  [0.6, -0.22, 0.12, 0.1, 0.7], // Mare Crisium
  [0.48, 0.2, 0.13, 0.16, 0.5], // Mare Fecunditatis
  [0.3, 0.32, 0.09, 0.08, 0.45], // Mare Nectaris
  [-0.18, 0.38, 0.2, 0.14, 0.45], // Mare Nubium
];
/** How each sea is built: offset x, y (in its own radii), size and weight of each blob */
const MARE_LOBES: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 1, 1],
  [0.45, -0.3, 0.6, 0.7],
  [-0.4, 0.35, 0.55, 0.6],
];
/** The bright young crater Tycho, low in the south: x, y, size */
const TYCHO = [-0.12, 0.64, 0.05] as const;
/** The sun's rim is a deeper amber than its centre (limb darkening) */
const SUN_RIM: Rgb = [236, 140, 44];
/** The seas are a cool grey against the moon's pale highlands */
const MARE: Rgb = [112, 120, 132];

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Blend two palettes key by key (t = 0 → a, t = 1 → b) */
export function lerpPalette(a: Palette, b: Palette, t: number): Palette {
  if (t <= 0 || a === b) return a;
  if (t >= 1) return b;
  const out = {} as Record<keyof Palette, Rgb>;
  for (const key of Object.keys(a) as (keyof Palette)[]) out[key] = mixRgb(a[key], b[key], t);
  return out;
}

const css = ([r, g, b]: Rgb, alpha = 1) => `rgb(${r | 0} ${g | 0} ${b | 0} / ${alpha})`;
const WHITE: Rgb = [255, 255, 255];

/**
 * Draw one frame: sky gradient → sun's halo → stars → shooting star → sun/moon → back clouds →
 * front clouds → balloon → birds.
 * Everything is procedural; clouds are stamped from small cached sprites. dpr only scales the backing store.
 */
export function renderScene(ctx: CanvasRenderingContext2D, dpr: number, scene: Scene): void {
  const { size, palette, night, clouds, accents, theme } = scene;
  const { width, height } = size;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, css(palette.skyTop));
  sky.addColorStop(SKY_MID, css(palette.skyBottom));
  sky.addColorStop(1, css(palette.skyHaze));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const sunShown = 1 - (scene.sunHidden ?? 0);
  drawHalo(ctx, accents, palette, (1 - night) * sunShown, theme);
  drawStars(ctx, accents, palette, night);
  const time = scene.time ?? 0;
  if (!scene.still) drawMeteor(ctx, size, palette, night * sunShown, time, theme);
  drawOrb(ctx, accents, palette, night, theme, scene.moonPhase ?? null, sunShown, height);

  const { backFade } = theme.clouds;
  const backPalette = {
    ...palette,
    cloud: mixRgb(palette.cloud, palette.skyBottom, backFade),
    cloudLight: mixRgb(palette.cloudLight, palette.skyBottom, backFade),
    cloudShadow: mixRgb(palette.cloudShadow, palette.skyBottom, backFade),
  };
  const strike = findStrike(time, scene.lightning ?? 0);
  drawClouds(ctx, clouds, "back", backPalette, accents, theme, width);
  if (strike) drawBolt(ctx, size, strike);
  drawClouds(ctx, clouds, "front", palette, accents, theme, width);
  // In front of the clouds, like the birds: on a grey day it would otherwise never be seen.
  // It stays down in bad weather.
  const fair = Math.max(0, 1 - 3 * (scene.rain ?? 0) - 3 * (scene.lightning ?? 0) - 1.5 * (scene.fog ?? 0));
  drawBalloon(ctx, accents.balloon, palette, (1 - night) * fair);
  if (strike) drawStrikeGlow(ctx, size, strike);
  drawRain(ctx, size, palette, scene.rain ?? 0, time, scene.wind ?? 1);
  drawFog(ctx, size, palette, scene.fog ?? 0);

  drawBirds(ctx, accents, palette, 1 - night, theme);
}

/** A wide, faint brightening of the sky around the sun. Day only. */
function drawHalo(ctx: CanvasRenderingContext2D, { orb }: Accents, palette: Palette, day: number, theme: Theme) {
  const alpha = theme.orb.haloAlpha * day * orb.visibility;
  if (alpha < 0.01) return;
  const r = orb.radius * theme.orb.haloScale;
  const halo = ctx.createRadialGradient(orb.x, orb.y, orb.radius, orb.x, orb.y, r);
  halo.addColorStop(0, css(palette.orbGlow, alpha));
  halo.addColorStop(1, css(palette.orbGlow, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(orb.x - r, orb.y - r, r * 2, r * 2);
}

/** Small round stars that twinkle by phase; hidden ones sit under an icon */
function drawStars(ctx: CanvasRenderingContext2D, { stars }: Accents, palette: Palette, night: number) {
  if (night < 0.01) return;
  for (const s of stars) {
    if (!s.visible) continue;
    ctx.fillStyle = css(palette.star, night * (0.55 + 0.45 * Math.sin(s.phase)));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, TAU);
    ctx.fill();
  }
}

/** The sun, or the moon with its craters fading in: a soft glow, then a shaded disc */
function drawOrb(
  ctx: CanvasRenderingContext2D,
  { orb }: Accents,
  palette: Palette,
  night: number,
  theme: Theme,
  phase: number | null,
  /** 1 in a clear sky, lower when cloud hides it */
  clearness = 1,
  /** Canvas height, to match the dark side of the moon to the sky behind it */
  skyHeight = 0,
) {
  const shown = orb.visibility * clearness;
  if (shown < 0.01) return;
  const { x, y, radius } = orb;
  const { glowScale, glowAlpha } = theme.orb;
  // Share of the moon that's lit: a thin crescent glows far less than a full moon
  const lit = phase === null ? 1 : (1 - Math.cos(phase * TAU)) / 2;
  const glowStrength = 1 - night * (1 - lit) * 0.75;

  const day = 1 - night;

  // A wide, soft bloom: warm around the sun, cool and fainter around a thin moon
  const glowRadius = radius * glowScale;
  const glow = ctx.createRadialGradient(x, y, radius * 0.9, x, y, glowRadius);
  glow.addColorStop(0, css(palette.orbGlow, glowAlpha * shown * glowStrength));
  glow.addColorStop(1, css(palette.orbGlow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);

  if (day > 0.01) drawSun(ctx, x, y, radius, palette, day * shown);
  if (night > 0.01) drawMoon(ctx, x, y, radius, palette, night * shown, phase, skyHeight);
}

/**
 * The sun as a light source rather than a flat disc: a tight bright corona added onto the sky,
 * then a disc that is near white in the middle and falls off to deep amber at the rim (limb
 * darkening), with an edge soft enough to sit among the soft clouds.
 */
function drawSun(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, palette: Palette, alpha: number) {
  const corona = ctx.createRadialGradient(x, y, radius * 0.95, x, y, radius * 1.7);
  corona.addColorStop(0, css(mixRgb(palette.orbGlow, WHITE, 0.6), 0.7 * alpha));
  corona.addColorStop(0.3, css(palette.orbGlow, 0.28 * alpha));
  corona.addColorStop(1, css(palette.orbGlow, 0));
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = corona;
  ctx.fillRect(x - radius * 1.7, y - radius * 1.7, radius * 3.4, radius * 3.4);
  ctx.globalCompositeOperation = "source-over";

  const edge = radius * 1.05;
  const disc = ctx.createRadialGradient(x, y, 0, x, y, edge);
  disc.addColorStop(0, css(mixRgb(palette.orb, WHITE, 0.92), alpha));
  disc.addColorStop(0.5, css(mixRgb(palette.orb, WHITE, 0.62), alpha));
  disc.addColorStop(0.82, css(mixRgb(palette.orb, WHITE, 0.2), alpha));
  disc.addColorStop(0.94, css(mixRgb(palette.orb, SUN_RIM, 0.22), alpha));
  disc.addColorStop(1, css(mixRgb(palette.orb, SUN_RIM, 0.22), 0));
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(x, y, edge, 0, TAU);
  ctx.fill();
}

/**
 * The moon as a lit body: pale highlands darkening a little toward the limb, its seas in their
 * real places, Tycho's bright pinpoint, and a soft terminator. The dark side keeps a trace of
 * earthshine, so the face still shows faintly through it.
 */
function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  palette: Palette,
  alpha: number,
  phase: number | null,
  skyHeight: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();

  const disc = ctx.createRadialGradient(x - radius * 0.15, y - radius * 0.15, 0, x, y, radius);
  disc.addColorStop(0, css(mixRgb(palette.orb, WHITE, 0.25), alpha));
  disc.addColorStop(0.7, css(palette.orb, alpha));
  disc.addColorStop(1, css(mixRgb(palette.orb, palette.orbDetail, 0.55), alpha));
  ctx.fillStyle = disc;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

  const mare = mixRgb(palette.orbDetail, MARE, 0.5);
  // Each sea is a few overlapping soft blobs, so its edge is ragged rather than a clean oval
  for (const [dx, dy, rx, ry, strength] of MARIA) {
    for (const [ox, oy, k, w] of MARE_LOBES) {
      ctx.save();
      ctx.translate(x + (dx + ox * rx) * radius, y + (dy + oy * ry) * radius);
      ctx.scale(rx * k * radius, ry * k * radius);
      const sea = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      sea.addColorStop(0, css(mare, 0.42 * w * strength * alpha));
      sea.addColorStop(0.4, css(mare, 0.3 * w * strength * alpha));
      sea.addColorStop(1, css(mare, 0));
      ctx.fillStyle = sea;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
  }

  const [tx, ty, ts] = TYCHO;
  const cx = x + tx * radius;
  const cy = y + ty * radius;
  const tycho = ctx.createRadialGradient(cx, cy, 0, cx, cy, ts * radius * 2.5);
  tycho.addColorStop(0, css(WHITE, 0.75 * alpha));
  tycho.addColorStop(0.3, css(WHITE, 0.25 * alpha));
  tycho.addColorStop(1, css(WHITE, 0));
  ctx.fillStyle = tycho;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

  if (phase !== null) {
    // The dark side takes the sky colour at the moon's height. The blur softens the terminator the
    // way the lunar surface does, and what shows through is earthshine.
    const behind = skyColorAt(palette, skyHeight > 0 ? y / skyHeight : 0);
    const shade = css(mixRgb(behind, palette.orbDetail, 0.12), 0.88 * alpha);
    ctx.fillStyle = shade;
    ctx.shadowColor = shade;
    ctx.shadowBlur = Math.max(2, radius * 0.12);
    ctx.beginPath();
    moonShadow(ctx, x, y, radius, phase);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }
  ctx.restore();
}

/** The sky gradient's colour at a height, as a share of the canvas (0 top, 1 bottom) */
function skyColorAt(palette: Palette, t: number): Rgb {
  const k = Math.min(1, Math.max(0, t));
  return k <= SKY_MID
    ? mixRgb(palette.skyTop, palette.skyBottom, k / SKY_MID)
    : mixRgb(palette.skyBottom, palette.skyHaze, (k - SKY_MID) / (1 - SKY_MID));
}

/**
 * The unlit part of the moon. One edge is the limb (a half circle on the dark side), the other the
 * terminator: a half ellipse whose width shrinks to nothing at the quarters. As seen from the
 * northern hemisphere, a waxing moon is lit on the right.
 */
function moonShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, phase: number) {
  const waxing = phase < 0.5;
  const crescent = Math.cos(phase * TAU) > 0; // less than half lit
  const rx = r * Math.abs(Math.cos(phase * TAU));
  const top = -Math.PI / 2;
  const bottom = Math.PI / 2;
  // Limb: top to bottom round the dark side
  ctx.arc(x, y, r, top, bottom, waxing);
  // Terminator: bottom back to top, bulging into the lit side for a crescent, into the dark side for a gibbous moon
  const throughRight = waxing === crescent;
  ctx.ellipse(x, y, rx, r, 0, bottom, throughRight ? top : top + TAU, throughRight);
  ctx.closePath();
}

// --- Clouds -------------------------------------------------------------------------------

type Light = "left" | "top" | "right";

/** Sprite size in device px; a puff is never drawn much larger than this */
const SPRITE_SIZE = 192;

/** Direction the light travels in for each side it comes from (normalised in makeSprite) */
const LIGHT_DIRECTION: Record<Light, readonly [number, number]> = {
  left: [0.55, 1],
  top: [0, 1],
  right: [-0.55, 1],
};

type SpriteSlot = { key: string; canvas: HTMLCanvasElement | OffscreenCanvas };

/** One sprite per layer and light side; rebuilt only when its colours change (e.g. during the day ↔ night fade) */
const sprites = new Map<string, SpriteSlot>();

function createCanvas(size: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(size, size);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  return canvas;
}

/**
 * A soft, shaded puff: an alpha mask that fades over its outer `softness`, filled with a
 * gradient from the lit colour (toward the light) through the base colour to the shadow.
 */
function makeSprite(canvas: HTMLCanvasElement | OffscreenCanvas, palette: Palette, softness: number, light: Light) {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) return;
  const c = SPRITE_SIZE / 2;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  const mask = ctx.createRadialGradient(c, c, 0, c, c, c);
  mask.addColorStop(0, "#fff");
  mask.addColorStop(Math.max(0, 1 - softness), "#fff");
  mask.addColorStop(1, "rgb(255 255 255 / 0)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  const [lx, ly] = LIGHT_DIRECTION[light];
  const length = Math.hypot(lx, ly);
  const ux = (lx / length) * c;
  const uy = (ly / length) * c;
  const shade = ctx.createLinearGradient(c - ux, c - uy, c + ux, c + uy);
  shade.addColorStop(0, css(palette.cloudLight));
  shade.addColorStop(0.45, css(palette.cloud));
  shade.addColorStop(1, css(palette.cloudShadow));
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  ctx.globalCompositeOperation = "source-over";
}

function sprite(layer: Cloud["layer"], light: Light, palette: Palette, softness: number) {
  const id = `${layer}:${light}`;
  const key = `${css(palette.cloud)}|${css(palette.cloudLight)}|${css(palette.cloudShadow)}|${softness}`;
  let slot = sprites.get(id);
  if (!slot) {
    slot = { key: "", canvas: createCanvas(SPRITE_SIZE) };
    sprites.set(id, slot);
  }
  if (slot.key !== key) {
    makeSprite(slot.canvas, palette, softness, light);
    slot.key = key;
  }
  return slot.canvas;
}

/** Below this share of its size a squeezed puff is hidden; above the second it's fully drawn */
const SQUEEZE_HIDE = 0.3;
const SQUEEZE_FULL = 0.55;

/** Puffs drawn lowest first, so the rounded tops overlap the shaded bases below them */
const drawOrder = new WeakMap<Cloud, number[]>();

function puffOrder(cloud: Cloud): number[] {
  let order = drawOrder.get(cloud);
  if (!order || order.length !== cloud.puffs.length) {
    order = cloud.puffs.map((_, i) => i).sort((a, b) => cloud.puffs[b].restDy - cloud.puffs[a].restDy);
    drawOrder.set(cloud, order);
  }
  return order;
}

/** Which side the light reaches a cloud from: the sun's (or moon's) side, or straight above when it's overhead */
function lightFor(cloud: Cloud, { orb }: Accents, width: number): Light {
  const dx = orb.x - cloud.x;
  if (Math.abs(dx) < width * 0.12) return "top";
  return dx < 0 ? "left" : "right";
}

function drawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  layer: Cloud["layer"],
  palette: Palette,
  accents: Accents,
  theme: Theme,
  width: number,
) {
  const { softness, opacity } = theme.clouds[layer];
  // The visible edge sits partway into the fade, so the sprite is drawn a little larger than the puff
  const spread = 1 / (1 - softness / 2);
  ctx.globalAlpha = opacity;
  for (const cloud of clouds) {
    if (cloud.layer !== layer) continue;
    const image = sprite(layer, lightFor(cloud, accents, width), palette, softness);
    for (const i of puffOrder(cloud)) {
      const p = cloud.puffs[i];
      // A puff squeezed to a fraction of its size reads as a stray dot, so it fades out instead
      const fade = Math.min(1, Math.max(0, (p.scale - SQUEEZE_HIDE) / (SQUEEZE_FULL - SQUEEZE_HIDE)));
      const r = p.r * p.scale * spread;
      if (fade <= 0 || r < 0.5) continue;
      ctx.globalAlpha = opacity * fade;
      ctx.drawImage(image, cloud.x + p.dx - r, cloud.y + p.dy - r, r * 2, r * 2);
    }
  }
  ctx.globalAlpha = 1;
}

/** Rain streaks per 100,000 px² of canvas at full strength, and how they fall (px/s) */
const RAIN_DENSITY = 20;
const RAIN_FALL = 520;
const RAIN_DRIFT = 90;
const RAIN_LENGTH = 18;

/** A repeatable 0–1 value for streak i, so the rain needs no stored state */
const hash = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Thin slanted streaks, falling and wrapping; their positions are a pure function of time */
function drawRain(
  ctx: CanvasRenderingContext2D,
  { width, height }: Size,
  palette: Palette,
  amount: number,
  time: number,
  wind: number,
) {
  if (amount < 0.01) return;
  const drift = RAIN_DRIFT * wind;
  const count = Math.round((RAIN_DENSITY * amount * width * height) / 100_000);
  const spanX = width + 60;
  const spanY = height + 40;
  const dx = (drift / RAIN_FALL) * RAIN_LENGTH;
  ctx.strokeStyle = css(palette.cloudLight, 0.55);
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const speed = 0.8 + 0.4 * hash(i, 3);
    const x = (((hash(i, 1) * spanX - time * drift * speed) % spanX) + spanX) % spanX - 30;
    const y = ((hash(i, 2) * spanY + time * RAIN_FALL * speed) % spanY) - 20;
    ctx.moveTo(x, y);
    ctx.lineTo(x - dx, y + RAIN_LENGTH);
  }
  ctx.stroke();
}

/** A low band of fog over the bottom of the sky, and a light haze over the rest */
function drawFog(ctx: CanvasRenderingContext2D, { width, height }: Size, palette: Palette, amount: number) {
  if (amount < 0.01) return;
  ctx.fillStyle = css(palette.skyHaze, 0.12 * amount);
  ctx.fillRect(0, 0, width, height);
  const band = ctx.createLinearGradient(0, height * 0.45, 0, height);
  band.addColorStop(0, css(palette.skyHaze, 0));
  band.addColorStop(1, css(palette.skyHaze, 0.75 * amount));
  ctx.fillStyle = band;
  ctx.fillRect(0, height * 0.45, width, height * 0.55);
}

// --- Lightning -----------------------------------------------------------------------------
//
// Accessibility: no full-screen flash. A strike is a bolt between the cloud layers and a soft glow
// around its top, at most two short pulses within 0.3 s, and never in two seconds running, so it
// stays well under three flashes a second. The engine passes no lightning with reduced motion.
// Strikes are a pure function of time, like the rain: each second may hold one, decided by a hash.

/** Chance of a strike in any one second at full strength (so about every 6 s) */
const STRIKE_CHANCE = 0.17;
/** How long a strike lasts, in seconds */
const STRIKE_LENGTH = 0.6;

type Strike = { seed: number; brightness: number };

const strikesIn = (second: number, rate: number) => hash(second, 11) < rate * STRIKE_CHANCE;

function findStrike(time: number, rate: number): Strike | null {
  if (rate < 0.01) return null;
  const now = Math.floor(time);
  for (const second of [now, now - 1]) {
    // Never two seconds in a row
    if (!strikesIn(second, rate) || strikesIn(second - 1, rate)) continue;
    const age = time - (second + hash(second, 12) * 0.4);
    if (age < 0 || age > STRIKE_LENGTH) continue;
    // A quick main pulse, then one fainter flicker
    const main = age < 0.05 ? age / 0.05 : Math.exp(-(age - 0.05) / 0.09);
    const flicker = age > 0.18 && age < 0.28 ? 0.5 * Math.sin(((age - 0.18) / 0.1) * Math.PI) : 0;
    const brightness = Math.min(1, main + flicker);
    if (brightness > 0.02) return { seed: second, brightness };
  }
  return null;
}

/** A jagged path down from the clouds, with one short fork; the same seed gives the same bolt */
function boltPoints(seed: number, { width, height }: Size) {
  const steps = 9;
  const x0 = width * (0.15 + 0.7 * hash(seed, 13));
  const y0 = height * (0.12 + 0.15 * hash(seed, 14));
  const length = height * (0.35 + 0.25 * hash(seed, 15));
  const main: [number, number][] = [[x0, y0]];
  for (let i = 1; i <= steps; i++) {
    const [px] = main[i - 1];
    main.push([px + (hash(seed, 20 + i) - 0.5) * 44, y0 + (length * i) / steps]);
  }
  const from = 3 + Math.floor(hash(seed, 16) * 3);
  const side = hash(seed, 17) < 0.5 ? -1 : 1;
  const fork: [number, number][] = [main[from]];
  for (let i = 1; i <= 3; i++) {
    const [px, py] = fork[i - 1];
    fork.push([px + side * (10 + hash(seed, 40 + i) * 22), py + length / steps]);
  }
  return { main, fork, top: main[0] };
}

function strokePath(ctx: CanvasRenderingContext2D, points: [number, number][]) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function drawBolt(ctx: CanvasRenderingContext2D, size: Size, { seed, brightness }: Strike) {
  const { main, fork } = boltPoints(seed, size);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgb(200 212 255 / ${0.4 * brightness})`;
  ctx.lineWidth = 9;
  strokePath(ctx, main);
  ctx.strokeStyle = `rgb(255 255 255 / ${brightness})`;
  ctx.lineWidth = 2.2;
  strokePath(ctx, main);
  ctx.strokeStyle = `rgb(255 255 255 / ${0.5 * brightness})`;
  ctx.lineWidth = 1.1;
  strokePath(ctx, fork);
}

/** The clouds around the top of the bolt light up; the rest of the sky doesn't */
function drawStrikeGlow(ctx: CanvasRenderingContext2D, size: Size, { seed, brightness }: Strike) {
  const [x, y] = boltPoints(seed, size).top;
  const r = Math.min(size.width, size.height) * 0.35;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
  glow.addColorStop(0, `rgb(225 232 255 / ${0.4 * brightness})`);
  glow.addColorStop(1, "rgb(225 232 255 / 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/**
 * One bird seen from afar: two wings that arc out from the body and bend at the wrist. While the
 * flock beats, the tips sweep from below the body to well above it; while it glides they are held
 * out, slightly raised. Smaller birds are drawn finer and fainter, so a flock has some depth.
 */
function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  half: number,
  phase: number,
  strength: number,
  color: Rgb,
  alpha: number,
  lineWidth: number,
) {
  if (alpha < 0.02) return;
  // Tip height: a steady glide pose, plus the beat scaled by how hard the flock is flapping
  const tip = half * (0.3 + 0.62 * strength * Math.sin(phase));
  // The wrist leads the tip a little, which is what makes a wingbeat read as a beat
  const wrist = half * (0.34 + 0.3 * strength * Math.sin(phase + 0.9));
  ctx.strokeStyle = css(color, alpha);
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x - half, y - tip);
  ctx.quadraticCurveTo(x - half * 0.5, y - wrist - half * 0.22, x, y);
  ctx.quadraticCurveTo(x + half * 0.5, y - wrist - half * 0.22, x + half, y - tip);
  ctx.stroke();
}

/** Small flocks in a loose V, each bird on its own beat, flapping for a while and then gliding. Day only. */
function drawBirds(ctx: CanvasRenderingContext2D, { birds }: Accents, palette: Palette, day: number, theme: Theme) {
  if (day < 0.01) return;
  const { size, lineWidth, alpha } = theme.birds;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const bird of birds) {
    const strength = flapStrength(bird.glide);
    // A glide sinks a touch and a beat lifts, so the flock rides gently up and down
    const ride = Math.sin(bird.glide) * size * 0.35;
    const y = bird.y - ride;
    for (const mate of bird.flock) {
      const a = alpha * mate.visibility * day * (0.55 + 0.45 * mate.scale);
      drawBird(ctx, bird.x + mate.dx, y + mate.dy, size * mate.scale, mate.phase, strength, palette.bird, a, lineWidth * mate.scale);
    }
    drawBird(ctx, bird.x, y, size * bird.scale, bird.phase, strength, palette.bird, alpha * bird.visibility * day, lineWidth * bird.scale);
  }
}

// The balloon wears the site's own colours: the amber of the sun and the green of the frame
const BALLOON_AMBER: Rgb = [246, 185, 59];
const BALLOON_CREAM: Rgb = [255, 246, 226];
const BALLOON_GREEN: Rgb = [13, 147, 115];
const BASKET: Rgb = [112, 78, 50];
/** Five gores seen on a round envelope: the middle one faces you, so it is the widest */
const GORES: readonly (readonly [from: number, to: number, color: Rgb])[] = [
  [-1, -0.81, BALLOON_AMBER],
  [-0.81, -0.31, BALLOON_CREAM],
  [-0.31, 0.31, BALLOON_GREEN],
  [0.31, 0.81, BALLOON_CREAM],
  [0.81, 1, BALLOON_AMBER],
];

/** A small hot-air balloon: a striped envelope tapering to its mouth, two ropes and a basket. Day only. */
function drawBalloon(ctx: CanvasRenderingContext2D, balloon: Balloon, palette: Palette, shown: number) {
  const alpha = shown * balloon.visibility;
  const { x, y, radius: r } = balloon;
  if (alpha < 0.02 || r < 1) return;
  const mouthY = y + r * 1.24;
  const mouth = r * 0.26;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Ropes and basket first, so the envelope's mouth sits over the rope ends
  const basketW = r * 0.44;
  const basketH = r * 0.3;
  const basketY = y + r * 1.62;
  ctx.strokeStyle = css(BASKET, 0.9);
  ctx.lineWidth = Math.max(0.6, r * 0.04);
  ctx.beginPath();
  ctx.moveTo(x - mouth, mouthY);
  ctx.lineTo(x - basketW / 2, basketY);
  ctx.moveTo(x + mouth, mouthY);
  ctx.lineTo(x + basketW / 2, basketY);
  ctx.stroke();
  ctx.fillStyle = css(BASKET);
  ctx.fillRect(x - basketW / 2, basketY, basketW, basketH);

  ctx.beginPath();
  ctx.moveTo(x - mouth, mouthY);
  ctx.bezierCurveTo(x - r * 0.5, y + r * 0.96, x - r, y + r * 0.56, x - r, y);
  ctx.arc(x, y, r, Math.PI, 0);
  ctx.bezierCurveTo(x + r, y + r * 0.56, x + r * 0.5, y + r * 0.96, x + mouth, mouthY);
  ctx.closePath();
  ctx.clip();

  for (const [from, to, color] of GORES) {
    ctx.fillStyle = css(color);
    // A hair of overlap, so no sky shows through between two gores
    ctx.fillRect(x + from * r - 0.5, y - r, (to - from) * r + 1, r * 2.3);
  }
  // Lit from the upper left, like the clouds around it, and falling into shade on the far side
  const shade = ctx.createLinearGradient(x - r, y, x + r, y);
  shade.addColorStop(0, css(WHITE, 0.28));
  shade.addColorStop(0.45, css(WHITE, 0));
  shade.addColorStop(1, css(palette.bird, 0.3));
  ctx.fillStyle = shade;
  ctx.fillRect(x - r, y - r, r * 2, r * 2.3);

  ctx.restore();
}

export type Meteor = { x: number; y: number; tailX: number; tailY: number; brightness: number };

/**
 * The shooting star in flight at this moment, if there is one. Like the rain and the lightning it
 * is a pure function of time: each stretch of seconds may hold one, decided by a hash.
 */
export function meteorAt(time: number, { width, height }: Size, theme: Theme): Meteor | null {
  const { every, chance, duration, travel } = theme.meteors;
  if (every <= duration || width <= 0 || height <= 0) return null;
  const slot = Math.floor(time / every);
  if (hash(slot, 21) >= chance) return null;

  const age = time - slot * every - hash(slot, 22) * (every - duration);
  if (age <= 0 || age >= duration) return null;
  const p = age / duration;

  // It falls shallowly to the left or the right, slowing as it burns out
  const angle = ((16 + 16 * hash(slot, 23)) * Math.PI) / 180;
  const dir = hash(slot, 24) < 0.5 ? -1 : 1;
  const reach = Math.min(width, height) * travel;
  const gone = reach * (1 - (1 - p) * (1 - p));
  const tail = reach * 0.4 * Math.sin(Math.PI * p);
  const ux = Math.cos(angle) * dir;
  const uy = Math.sin(angle);
  const x = width * (0.2 + 0.6 * hash(slot, 25)) + ux * gone;
  const y = height * (0.06 + 0.2 * hash(slot, 26)) + uy * gone;
  return { x, y, tailX: x - ux * tail, tailY: y - uy * tail, brightness: Math.sin(Math.PI * p) ** 0.6 };
}

/** A thin streak that brightens toward its head. Night only, and only when the sky is clear enough to see it. */
function drawMeteor(ctx: CanvasRenderingContext2D, size: Size, palette: Palette, night: number, time: number, theme: Theme) {
  if (night < 0.5) return;
  const meteor = meteorAt(time, size, theme);
  if (!meteor) return;
  const alpha = night * meteor.brightness;
  const streak = ctx.createLinearGradient(meteor.tailX, meteor.tailY, meteor.x, meteor.y);
  streak.addColorStop(0, css(palette.star, 0));
  streak.addColorStop(1, css(palette.star, alpha));
  ctx.strokeStyle = streak;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(meteor.tailX, meteor.tailY);
  ctx.lineTo(meteor.x, meteor.y);
  ctx.stroke();
  ctx.fillStyle = css(palette.star, alpha);
  ctx.beginPath();
  ctx.arc(meteor.x, meteor.y, 1.5, 0, TAU);
  ctx.fill();
}
