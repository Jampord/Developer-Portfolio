import {
  createAccents,
  settleAccents,
  stepAccents,
  updateAccentTargets,
  type Accents,
  type OrbArc,
  type OrbPlacement,
} from "./accents";
import { blowClouds, createClouds, settleClouds, stepClouds, type CloudContext } from "./clouds";
import { buildField, type Field } from "./field";
import { buildGrid } from "./grid";
import { createLoop } from "./loop";
import { mulberry32 } from "./random";
import { lerpPalette, renderScene } from "./renderer";
import type { Palette, Theme } from "../themes/types";
import type { Cloud, EngineOptions, Mode, Rect, Size, Vec2 } from "./types";
import { createWind, gust, setWindSolids, stepWind, type Wind } from "./wind";

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
   * A cursor or finger moving over the sky at (x, y) canvas px, at (vx, vy) px/s: it pushes a gust
   * into the air there. `strength` (0–1) is lighter for touch. Ignored with reduced motion.
   */
  stir(x: number, y: number, vx: number, vy: number, strength?: number): void;
  /** On: stop the loop and draw a settled scene once per change */
  setReducedMotion(on: boolean): void;
  pause(): void;
  resume(): void;
  destroy(): void;
};

/** Rain, lightning and fog (0–1), how much cloud hides the sun (0–1), and a wind multiplier for the rain's slant */
export type Weather = { rain: number; sunHidden: number; lightning: number; fog: number; wind: number };

const CALM: Weather = { rain: 0, sunHidden: 0, lightning: 0, fog: 0, wind: 1 };

/** A gust from the cursor reaches this far (px) and pulls the air this much toward its speed */
const STIR_RADIUS = 80;
const STIR_WEIGHT = 0.55;
/** A dragged icon pushes the air around it, out to this far past its edge (px) */
const ICON_REACH = 30;
const ICON_WEIGHT = 0.6;
/** Further than this in one frame (px) is a relayout, not a drag */
const MAX_DRAG_STEP = 160;

type Stir = { x: number; y: number; vx: number; vy: number; strength: number };

/** Enough fixed steps for the springs to come to rest */
const SETTLE_STEPS = 90;

export function createEngine(canvas: HTMLCanvasElement, { theme: initialTheme, seed = 1, mode = "day" }: EngineOptions): Engine {
  let theme = initialTheme;
  const ctx = canvas.getContext("2d");

  let size: Size = { width: 0, height: 0 };
  let dpr = 1;
  let obstacles: Rect[] = [];
  let wind: Wind = createWind({ width: 0, height: 0 });
  /** Gusts from the cursor since the last frame */
  let stirs: Stir[] = [];
  /** Icon centres at the last frame, to tell how fast each one is being dragged */
  let lastCentres: Vec2[] = [];
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
    setWindSolids(wind, field);
  }

  /** Fresh seeded layout for the current size, settled so the first paint already avoids the icons */
  function layout() {
    const rng = mulberry32(seed);
    clouds = createClouds(size, field, theme, rng);
    accents = createAccents(size, field, theme, rng, placement);
    settle();
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
    });
  }

  function frame(dt: number) {
    elapsed += dt;
    const sim = context();
    pushGusts(dt);
    stepWind(wind, dt);
    stepClouds(clouds, dt, sim);
    blowClouds(clouds, wind, dt, field);
    stepAccents(accents, dt, sim);
    if (modeT !== modeTarget) {
      const step = dt / theme.modeFade;
      modeT = modeT < modeTarget ? Math.min(modeTarget, modeT + step) : Math.max(modeTarget, modeT - step);
    }
    draw();
  }

  /** Gusts from the cursor, and from icons being dragged (matched by order; a jump is a relayout, not a drag) */
  function pushGusts(dt: number) {
    for (const s of stirs) gust(wind, s.x, s.y, s.vx, s.vy, STIR_RADIUS, STIR_WEIGHT * s.strength);
    stirs = [];

    const centres = obstacles.map((r) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 }));
    if (dt > 0 && centres.length === lastCentres.length) {
      for (let i = 0; i < centres.length; i++) {
        const dx = centres[i].x - lastCentres[i].x;
        const dy = centres[i].y - lastCentres[i].y;
        if ((dx === 0 && dy === 0) || Math.hypot(dx, dy) > MAX_DRAG_STEP) continue;
        const r = obstacles[i];
        gust(wind, centres[i].x, centres[i].y, dx / dt, dy / dt, Math.hypot(r.width, r.height) / 2 + ICON_REACH, ICON_WEIGHT);
      }
    }
    lastCentres = centres;
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
      if (resized) wind = createWind(size);
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

    stir(x, y, vx, vy, strength = 1) {
      if (destroyed || reducedMotion || !loop.running) return;
      // Many events can arrive between frames; keep the latest few
      if (stirs.length >= 8) stirs.shift();
      stirs.push({ x, y, vx, vy, strength });
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
