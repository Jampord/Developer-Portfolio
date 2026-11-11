import type { Palette, Rgb, Theme } from "../themes/types";
import type { Accents } from "./accents";
import type { Cloud, Size } from "./types";

export type Scene = {
  size: Size;
  palette: Palette;
  clouds: Cloud[];
  accents: Accents;
  theme: Theme;
};

const TAU = Math.PI * 2;

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
 * Draw one frame: sky gradient → sun → back clouds → front clouds → birds.
 * Everything is flat and procedural; dpr only scales the backing store.
 */
export function renderScene(ctx: CanvasRenderingContext2D, dpr: number, scene: Scene): void {
  const { size, palette, clouds, accents, theme } = scene;
  const { width, height } = size;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, css(palette.skyTop));
  sky.addColorStop(1, css(palette.skyBottom));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  drawSun(ctx, accents, palette, theme.sun.radius);

  const fade = theme.clouds.backFade;
  drawClouds(
    ctx,
    clouds,
    "back",
    css(mixRgb(palette.cloud, palette.skyBottom, fade)),
    css(mixRgb(palette.cloudShadow, palette.skyBottom, fade)),
  );
  drawClouds(ctx, clouds, "front", css(palette.cloud), css(palette.cloudShadow));

  drawBirds(ctx, accents, palette, theme.birds.size);
}

function drawSun(ctx: CanvasRenderingContext2D, { sun }: Accents, palette: Palette, radius: number) {
  ctx.fillStyle = css(palette.sunGlow, 0.35);
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, radius * 1.7, 0, TAU);
  ctx.fill();

  ctx.fillStyle = css(palette.sun);
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, radius, 0, TAU);
  ctx.fill();
}

/** Flat two-tone clouds: a shadow pass shifted down, then the main pass on top. One path per pass. */
function drawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  layer: Cloud["layer"],
  fill: string,
  shadow: string,
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
        const y = cloud.y + p.dy + (pass === "shadow" ? Math.max(2, r * 0.18) : 0);
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
    }
    ctx.fill();
  }
}

/** Small "V" birds; the wing tips rise and fall with the flap phase */
function drawBirds(ctx: CanvasRenderingContext2D, { birds }: Accents, palette: Palette, size: number) {
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const bird of birds) {
    if (bird.visibility < 0.02) continue;
    const lift = size * (0.45 + 0.35 * Math.sin(bird.phase));
    ctx.strokeStyle = css(palette.bird, 0.85 * bird.visibility);
    ctx.beginPath();
    ctx.moveTo(bird.x - size, bird.y - lift);
    ctx.lineTo(bird.x, bird.y);
    ctx.lineTo(bird.x + size, bird.y - lift);
    ctx.stroke();
  }
}
