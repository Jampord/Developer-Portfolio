import {
  createAccents,
  settleAccents,
  stepAccents,
  updateAccentTargets,
  type Accents,
  type OrbArc,
  type OrbPlacement,
} from "./accents";
import { createClouds, settleClouds, stepClouds, type CloudContext } from "./clouds";
import { buildField, type Field } from "./field";
import { buildGrid } from "./grid";
import { createLoop } from "./loop";
import { mulberry32 } from "./random";
import { lerpPalette, renderScene } from "./renderer";
import type { Palette, Theme } from "../themes/types";
import type { Cloud, EngineOptions, Mode, Rect, Size } from "./types";

export type Engine = {
  /** Canvas size in CSS px; dpr should already be capped (at 2) */
  setSize(width: number, height: number, dpr: number): void;
  setObstacles(rects: readonly Rect[]): void;
  /** Keep the sun and moon below this line, in CSS px from the canvas top (e.g. under a sticky header) */
  setOrbTop(top: number): void;
  /**
   * Put the sun or moon on its arc across the sky (e.g. from the real time of day), or null for the
   * roomiest open sky. `horizon` is in px up from the canvas bottom.
   */
  setOrbArc(arc: OrbArc | null, horizon?: number): void;
  /** What the sun or moon fades out behind (canvas px); null for every obstacle */
  setOrbBlockers(rects: readonly Rect[] | null): void;
  /** Cross-fades the palette (instant with reduced motion or while stopped) */
  setMode(mode: Mode): void;
  /** Replace the theme's day and night palettes (e.g. tinted for the time of day); null restores them */
  setPalettes(palettes: { day: Palette; night: Palette } | null): void;
  /** The moon's phase, 0–1 (0 new, 0.5 full); null draws a full moon */
  setMoonPhase(phase: number | null): void;
  /** Swap the theme (e.g. more, bigger clouds for overcast weather); the clouds are laid out again */
  setTheme(theme: Theme): void;
  /** Rain streaks (0–1, none with reduced motion) and how much cloud hides the sun or moon (0–1) */
  setWeather(weather: Weather): void;
  /**
   * Play the sky's arrival: the sun or moon rises from below into its place. Does nothing with
   * reduced motion, or while the sky is paused.
   */
  enter(): void;
  /** On: stop the loop and draw a settled scene once per change */
  setReducedMotion(on: boolean): void;
  pause(): void;
  resume(): void;
  destroy(): void;
};

/** Rain, lightning and fog (0–1), how much cloud hides the sun (0–1), and a wind multiplier for the rain's slant */
export type Weather = { rain: number; sunHidden: number; lightning: number; fog: number; wind: number };

const CALM: Weather = { rain: 0, sunHidden: 0, lightning: 0, fog: 0, wind: 1 };

/** Enough fixed steps for the springs to come to rest */
const SETTLE_STEPS = 90;

export function createEngine(canvas: HTMLCanvasElement, { theme: initialTheme, seed = 1, mode = "day" }: EngineOptions): Engine {
  let theme = initialTheme;
  const ctx = canvas.getContext("2d");

  let size: Size = { width: 0, height: 0 };
  let dpr = 1;
  let obstacles: Rect[] = [];
  let placement: OrbPlacement = { top: 0, horizon: 0, arc: null };
  let field: Field = buildField(buildGrid(size, obstacles, gridOptions()));
  let clouds: Cloud[] = [];
  let accents: Accents = createAccents(size, field, theme, mulberry32(seed));

  // Start in the right mode so the first paint never flashes the other sky
  let modeTarget = mode === "night" ? 1 : 0;
  let modeT = modeTarget;
  let paletteOverride: { day: Palette; night: Palette } | null = null;
  let moonPhase: number | null = null;
  let weather = CALM;
  /** Seconds the loop has run, for the falling rain */
  let elapsed = 0;
  let reducedMotion = false;
  /** True once the sky has been laid out at a real size, so there is a position worth keeping */
  let laidOut = false;
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
    // While the sky is running, the sun or moon keeps its place and eases to the new one, so
    // weather arriving a moment after the sky is switched on can't cut its rise short
    const from = laidOut && loop.running ? { x: accents.orb.x, y: accents.orb.y, visibility: accents.orb.visibility } : null;
    const rng = mulberry32(seed);
    clouds = createClouds(size, field, theme, rng);
    accents = createAccents(size, field, theme, rng, placement);
    settle();
    if (from) Object.assign(accents.orb, from);
    laidOut = size.width > 0 && size.height > 0;
  }

  function settle() {
    settleClouds(clouds, SETTLE_STEPS, context());
    settleAccents(accents, field);
  }

  function draw() {
    if (!ctx || destroyed || size.width <= 0 || size.height <= 0) return;
    const { day, night } = paletteOverride ?? theme.palettes;
    const t = modeT * modeT * (3 - 2 * modeT); // smoothstep
    renderScene(ctx, dpr, { size, palette: lerpPalette(day, night, t), night: t, clouds, accents, theme, moonPhase,
      // Nothing falls or flashes with reduced motion
      rain: reducedMotion ? 0 : weather.rain,
      lightning: reducedMotion ? 0 : weather.lightning,
      sunHidden: weather.sunHidden,
      fog: weather.fog,
      wind: weather.wind,
      time: elapsed,
      still: reducedMotion,
    });
  }

  function frame(dt: number) {
    elapsed += dt;
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
      updateAccentTargets(accents, field, size, theme, placement);
      applyNow();
    },

    setOrbTop(top) {
      if (destroyed || top === placement.top) return;
      placement = { ...placement, top };
      updateAccentTargets(accents, field, size, theme, placement);
      applyNow();
    },

    setOrbBlockers(rects) {
      if (destroyed) return;
      placement = { ...placement, blockers: rects ? rects.map((r) => ({ ...r })) : null };
      updateAccentTargets(accents, field, size, theme, placement);
      applyNow();
    },

    setOrbArc(arc, horizon = 0) {
      if (destroyed) return;
      const same =
        horizon === placement.horizon &&
        (arc === placement.arc ||
          (arc !== null && arc !== "below" && placement.arc !== null && placement.arc !== "below" && arc.progress === placement.arc.progress));
      if (same) return;
      placement = { ...placement, arc, horizon };
      updateAccentTargets(accents, field, size, theme, placement);
      applyNow();
    },

    setPalettes(next) {
      if (destroyed) return;
      paletteOverride = next;
      if (!loop.running) draw();
    },

    setMoonPhase(phase) {
      if (destroyed) return;
      moonPhase = phase;
      if (!loop.running) draw();
    },

    setTheme(next) {
      if (destroyed || next === theme) return;
      theme = next;
      rebuildField();
      layout();
      if (!loop.running) draw();
    },

    setWeather(next) {
      if (destroyed) return;
      weather = { ...next };
      if (!loop.running) draw();
    },

    setMode(mode) {
      if (destroyed) return;
      modeTarget = mode === "night" ? 1 : 0;
      if (!loop.running) {
        modeT = modeTarget;
        draw();
      }
    },

    enter() {
      if (destroyed || !loop.running) return;
      // It keeps its target, so the usual easing carries it up from under the horizon
      accents.orb.y = size.height + accents.orb.radius * 2;
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
