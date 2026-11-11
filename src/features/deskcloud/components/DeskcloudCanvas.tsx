"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createEngine, type Engine } from "../engine/engine";
import type { Mode, Rect } from "../engine/types";
import { sky } from "../themes";
import type { Rgb } from "../themes/types";

const MAX_DPR = 2;

const gradient = (top: Rgb, bottom: Rgb) => `linear-gradient(rgb(${top.join(" ")}), rgb(${bottom.join(" ")}))`;

// The same sky as a CSS gradient, shown under the canvas until its first frame is drawn
const placeholder = {
  "--sky-day": gradient(sky.palettes.day.skyTop, sky.palettes.day.skyBottom),
  "--sky-night": gradient(sky.palettes.night.skyTop, sky.palettes.night.skyBottom),
} as React.CSSProperties;

/** next-themes puts the class on <html> before React loads, so this is right from the first paint */
const currentMode = (): Mode => (document.documentElement.classList.contains("dark") ? "night" : "day");

type Props = {
  /** Icon bounds relative to the canvas, in CSS px */
  obstacles: readonly Rect[];
  className?: string;
};

/** Owns the <canvas> and the engine instance; purely decorative, all interaction lives on the HTML above it */
export function DeskcloudCanvas({ obstacles, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createEngine(canvas, { theme: sky, mode: currentMode() });
    engineRef.current = engine;

    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      engine.setSize(width, height, Math.min(window.devicePixelRatio || 1, MAX_DPR));
    });
    resize.observe(canvas);

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => engine.setReducedMotion(motion.matches);
    onMotion();
    motion.addEventListener("change", onMotion);

    return () => {
      resize.disconnect();
      motion.removeEventListener("change", onMotion);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setObstacles(obstacles);
  }, [obstacles]);

  // Follow the site's light/dark toggle (and the command palette's theme action) with a cross-fade
  useEffect(() => {
    if (resolvedTheme) engineRef.current?.setMode(resolvedTheme === "dark" ? "night" : "day");
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={placeholder}
      className={`bg-(image:--sky-day) dark:bg-(image:--sky-night) ${className}`}
    />
  );
}
