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

  drawHalo(ctx, accents, palette, 1 - night, theme);
  drawStars(ctx, accents, palette, night);
  drawOrb(ctx, accents, palette, night, theme);

  const { backFade } = theme.clouds;
  const backPalette = {
    ...palette,
    cloud: mixRgb(palette.cloud, palette.skyBottom, backFade),
    cloudLight: mixRgb(palette.cloudLight, palette.skyBottom, backFade),
    cloudShadow: mixRgb(palette.cloudShadow, palette.skyBottom, backFade),
  };
  drawClouds(ctx, clouds, "back", backPalette, accents, theme, width);
  drawClouds(ctx, clouds, "front", palette, accents, theme, width);

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
function drawOrb(ctx: CanvasRenderingContext2D, { orb }: Accents, palette: Palette, night: number, theme: Theme) {
  const shown = orb.visibility;
  if (shown < 0.01) return;
  const { x, y, radius } = orb;
  const { glowScale, glowAlpha } = theme.orb;

  const glowRadius = radius * glowScale;
  const glow = ctx.createRadialGradient(x, y, radius * 0.9, x, y, glowRadius);
  glow.addColorStop(0, css(palette.orbGlow, glowAlpha * shown));
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
      const r = p.r * p.scale * spread;
      if (r < 0.5) continue;
      ctx.drawImage(image, cloud.x + p.dx - r, cloud.y + p.dy - r, r * 2, r * 2);
    }
  }
  ctx.globalAlpha = 1;
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
