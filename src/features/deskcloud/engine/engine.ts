import { createAccents, settleAccents, stepAccents, updateAccentTargets, type Accents } from "./accents";
import { createClouds, settleClouds, stepClouds, type CloudContext } from "./clouds";
import { buildField, type Field } from "./field";
import { buildGrid } from "./grid";
import { createLoop } from "./loop";
import { mulberry32 } from "./random";
import { lerpPalette, renderScene } from "./renderer";
import type { Cloud, EngineOptions, Mode, Rect, Size } from "./types";

export type Engine = {
  /** Canvas size in CSS px; dpr should already be capped (at 2) */
  setSize(width: number, height: number, dpr: number): void;
  setObstacles(rects: readonly Rect[]): void;
  /** Keep the sun and moon below this line, in CSS px from the canvas top (e.g. under a sticky header) */
  setOrbTop(top: number): void;
  /** Cross-fades the palette (instant with reduced motion or while stopped) */
  setMode(mode: Mode): void;
  /** On: stop the loop and draw a settled scene once per change */
  setReducedMotion(on: boolean): void;
  pause(): void;
  resume(): void;
  destroy(): void;
};

/** Enough fixed steps for the springs to come to rest */
const SETTLE_STEPS = 90;

export function createEngine(canvas: HTMLCanvasElement, { theme, seed = 1, mode = "day" }: EngineOptions): Engine {
  const ctx = canvas.getContext("2d");

  let size: Size = { width: 0, height: 0 };
  let dpr = 1;
  let obstacles: Rect[] = [];
  let orbTop = 0;
  let field: Field = buildField(buildGrid(size, obstacles, gridOptions()));
  let clouds: Cloud[] = [];
  let accents: Accents = createAccents(size, field, theme, mulberry32(seed));

  // Start in the right mode so the first paint never flashes the other sky
  let modeTarget = mode === "night" ? 1 : 0;
  let modeT = modeTarget;
  let reducedMotion = false;
  let paused = false;
  let destroyed = false;

  const loop = createLoop(frame);

  function gridOptions() {
    return { cellSize: theme.cellSize, padding: theme.iconPadding };
  }

  function context(): CloudContext {
    return { field, size, theme };
  }

  function rebuildField() {
    field = buildField(buildGrid(size, obstacles, gridOptions()));
  }

  /** Fresh seeded layout for the current size, settled so the first paint already avoids the icons */
  function layout() {
    const rng = mulberry32(seed);
    clouds = createClouds(size, field, theme, rng);
    accents = createAccents(size, field, theme, rng, orbTop);
    settle();
  }

  function settle() {
    settleClouds(clouds, SETTLE_STEPS, context());
    settleAccents(accents, field, theme);
  }

  function draw() {
    if (!ctx || destroyed || size.width <= 0 || size.height <= 0) return;
    const { day, night } = theme.palettes;
    const t = modeT * modeT * (3 - 2 * modeT); // smoothstep
    renderScene(ctx, dpr, { size, palette: lerpPalette(day, night, t), night: t, clouds, accents, theme });
  }

  function frame(dt: number) {
    const sim = context();
    stepClouds(clouds, dt, sim);
    stepAccents(accents, dt, sim);
    if (modeT !== modeTarget) {
      const step = dt / theme.modeFade;
      modeT = modeT < modeTarget ? Math.min(modeTarget, modeT + step) : Math.max(modeTarget, modeT - step);
    }
    draw();
  }

  /** The loop runs only when there's something to animate and nobody asked it to stop */
  function sync() {
    const shouldRun = !destroyed && !!ctx && !paused && !reducedMotion && size.width > 0 && size.height > 0;
    if (shouldRun) loop.start();
    else loop.stop();
  }

  /** While the loop is stopped, changes are applied instantly so the next paint is already correct */
  function applyNow() {
    if (loop.running) return;
    settle();
    draw();
  }

  return {
    setSize(width, height, nextDpr) {
      if (destroyed) return;
      if (width === size.width && height === size.height && nextDpr === dpr) return;
      const resized = width !== size.width || height !== size.height;
      size = { width, height };
      dpr = nextDpr;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      if (resized) {
        rebuildField();
        layout();
      }
      draw();
      sync();
    },

    setObstacles(rects) {
      if (destroyed || sameRects(rects, obstacles)) return;
      obstacles = rects.map((r) => ({ ...r }));
      rebuildField();
      updateAccentTargets(accents, field, size, theme, orbTop);
      applyNow();
    },

    setOrbTop(top) {
      if (destroyed || top === orbTop) return;
      orbTop = top;
      updateAccentTargets(accents, field, size, theme, orbTop);
      applyNow();
    },

    setMode(mode) {
      if (destroyed) return;
      modeTarget = mode === "night" ? 1 : 0;
      if (!loop.running) {
        modeT = modeTarget;
        draw();
      }
    },

    setReducedMotion(on) {
      if (destroyed || on === reducedMotion) return;
      reducedMotion = on;
      sync();
      if (on) {
        modeT = modeTarget;
        applyNow();
      }
    },

    pause() {
      paused = true;
      sync();
    },

    resume() {
      paused = false;
      sync();
    },

    destroy() {
      destroyed = true;
      loop.stop();
    },
  };
}

function sameRects(a: readonly Rect[], b: readonly Rect[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((r, i) => r.x === b[i].x && r.y === b[i].y && r.width === b[i].width && r.height === b[i].height);
}
