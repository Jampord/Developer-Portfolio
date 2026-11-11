import type { Palette, Rgb, Theme } from "../themes/types";
import type { Accents } from "./accents";
import type { Cloud, Size } from "./types";

export type Scene = {
  size: Size;
  /** Already blended for the current point in the day → night fade */
  palette: Palette;
  /** 0 = day, 1 = night (eased): fades stars and moon craters in, birds out */
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

/**
 * Draw one frame: sky gradient → stars → sun/moon → back clouds → front clouds → birds.
 * Everything is flat and procedural; dpr only scales the backing store.
 */
export function renderScene(ctx: CanvasRenderingContext2D, dpr: number, scene: Scene): void {
  const { size, palette, night, clouds, accents, theme } = scene;
  const { width, height } = size;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, css(palette.skyTop));
  sky.addColorStop(1, css(palette.skyBottom));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  drawStars(ctx, accents, palette, night);
  drawOrb(ctx, accents, palette, night, theme);

  const { backFade, shadowOffset } = theme.clouds;
  drawClouds(
    ctx,
    clouds,
    "back",
    css(mixRgb(palette.cloud, palette.skyBottom, backFade)),
    css(mixRgb(palette.cloudShadow, palette.skyBottom, backFade)),
    shadowOffset,
  );
  drawClouds(ctx, clouds, "front", css(palette.cloud), css(palette.cloudShadow), shadowOffset);

  drawBirds(ctx, accents, palette, 1 - night, theme);
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

/** The sun, or the moon with its craters fading in */
function drawOrb(ctx: CanvasRenderingContext2D, { orb }: Accents, palette: Palette, night: number, theme: Theme) {
  const { radius, glowScale, glowAlpha } = theme.orb;

  ctx.fillStyle = css(palette.orbGlow, glowAlpha);
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, radius * glowScale, 0, TAU);
  ctx.fill();

  ctx.fillStyle = css(palette.orb);
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, radius, 0, TAU);
  ctx.fill();

  if (night < 0.01) return;
  ctx.fillStyle = css(palette.orbDetail, night);
  ctx.beginPath();
  for (const [dx, dy, r] of CRATERS) {
    const x = orb.x + dx * radius;
    const y = orb.y + dy * radius;
    ctx.moveTo(x + r * radius, y);
    ctx.arc(x, y, r * radius, 0, TAU);
  }
  ctx.fill();
}

/** Flat two-tone clouds: a shadow pass shifted down, then the main pass on top. One path per pass. */
function drawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  layer: Cloud["layer"],
  fill: string,
  shadow: string,
  shadowOffset: number,
) {
  for (const pass of ["shadow", "main"] as const) {
    ctx.fillStyle = pass === "shadow" ? shadow : fill;
    ctx.beginPath();
    for (const cloud of clouds) {
      if (cloud.layer !== layer) continue;
      for (const p of cloud.puffs) {
        const r = p.r * p.scale;
        if (r < 0.5) continue;
        const x = cloud.x + p.dx;
        const y = cloud.y + p.dy + (pass === "shadow" ? Math.max(2, r * shadowOffset) : 0);
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
    }
    ctx.fill();
  }
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
