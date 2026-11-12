import type { Palette, Rgb, Theme } from "../themes/types";
import type { Accents } from "./accents";
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
};

const TAU = Math.PI * 2;

/** Crater spots on the moon, as fractions of its radius: x, y, size */
const CRATERS: readonly (readonly [number, number, number])[] = [
  [-0.32, -0.18, 0.22],
  [0.26, 0.12, 0.16],
  [-0.06, 0.4, 0.12],
];

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
 * Draw one frame: sky gradient → sun's halo → stars → sun/moon → back clouds → front clouds → birds.
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
  drawOrb(ctx, accents, palette, night, theme, scene.moonPhase ?? null, sunShown, height);

  const { backFade } = theme.clouds;
  const backPalette = {
    ...palette,
    cloud: mixRgb(palette.cloud, palette.skyBottom, backFade),
    cloudLight: mixRgb(palette.cloudLight, palette.skyBottom, backFade),
    cloudShadow: mixRgb(palette.cloudShadow, palette.skyBottom, backFade),
  };
  const time = scene.time ?? 0;
  const strike = findStrike(time, scene.lightning ?? 0);
  drawClouds(ctx, clouds, "back", backPalette, accents, theme, width);
  if (strike) drawBolt(ctx, size, strike);
  drawClouds(ctx, clouds, "front", palette, accents, theme, width);
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

  const glowRadius = radius * glowScale;
  const glow = ctx.createRadialGradient(x, y, radius * 0.9, x, y, glowRadius);
  glow.addColorStop(0, css(palette.orbGlow, glowAlpha * shown * glowStrength));
  glow.addColorStop(1, css(palette.orbGlow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);

  // Lit from the upper left: a bright core by day, a pale limb shading toward the edge by night
  const disc = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
  disc.addColorStop(0, css(mixRgb(palette.orb, WHITE, 0.55 * (1 - night) + 0.25 * night), shown));
  disc.addColorStop(0.75, css(palette.orb, shown));
  disc.addColorStop(1, css(mixRgb(palette.orb, palette.orbDetail, night * 0.6), shown));
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();

  if (night < 0.01) return;
  for (const [dx, dy, size] of CRATERS) {
    const cx = x + dx * radius;
    const cy = y + dy * radius;
    const r = size * radius;
    const crater = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    crater.addColorStop(0, css(palette.orbDetail, 0.75 * night * shown));
    crater.addColorStop(1, css(palette.orbDetail, 0));
    ctx.fillStyle = crater;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  if (phase === null) return;
  // The dark side takes the sky colour at the moon's height, with a trace of earthshine
  const behind = skyColorAt(palette, skyHeight > 0 ? y / skyHeight : 0);
  ctx.fillStyle = css(mixRgb(behind, palette.orbDetail, 0.1), 0.94 * night * shown);
  ctx.beginPath();
  moonShadow(ctx, x, y, radius, phase);
  ctx.fill();
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

/** Small "V" birds; the wing tips rise and fall with the flap phase. Day only. */
function drawBirds(ctx: CanvasRenderingContext2D, { birds }: Accents, palette: Palette, day: number, theme: Theme) {
  if (day < 0.01) return;
  const { size, lineWidth, alpha } = theme.birds;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const bird of birds) {
    const a = alpha * bird.visibility * day;
    if (a < 0.02) continue;
    const lift = size * (0.45 + 0.35 * Math.sin(bird.phase));
    ctx.strokeStyle = css(palette.bird, a);
    ctx.beginPath();
    ctx.moveTo(bird.x - size, bird.y - lift);
    ctx.lineTo(bird.x, bird.y);
    ctx.lineTo(bird.x + size, bird.y - lift);
    ctx.stroke();
  }
}
