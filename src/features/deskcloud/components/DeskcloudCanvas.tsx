"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createEngine, type Engine } from "../engine/engine";
import type { Mode, Rect } from "../engine/types";
import { sky } from "../themes";
import { skyBackgroundClass, skyBackgroundStyle } from "./demoFrame";

const MAX_DPR = 2;

/** next-themes puts the class on <html> before React loads, so this is right from the first paint */
const currentMode = (): Mode => (document.documentElement.classList.contains("dark") ? "night" : "day");

type Props = {
  /** Icon bounds relative to the canvas, in CSS px */
  obstacles: readonly Rect[];
  /** Where the visible sky starts, in CSS px from the canvas top; the sun and moon stay below it */
  orbTop?: number;
  className?: string;
};

/** Owns the <canvas> and the engine instance; purely decorative, all interaction lives on the HTML above it */
export function DeskcloudCanvas({ obstacles, orbTop = 0, className = "" }: Props) {
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

    // No animation work while the canvas is scrolled away or the tab is hidden
    let onScreen = true;
    const syncPause = () => (onScreen && !document.hidden ? engine.resume() : engine.pause());
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncPause();
    });
    visibility.observe(canvas);
    document.addEventListener("visibilitychange", syncPause);
    syncPause();

    return () => {
      resize.disconnect();
      visibility.disconnect();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", syncPause);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setObstacles(obstacles);
  }, [obstacles]);

  useEffect(() => {
    engineRef.current?.setOrbTop(orbTop);
  }, [orbTop]);

  // Follow the site's light/dark toggle (and the command palette's theme action) with a cross-fade
  useEffect(() => {
    if (resolvedTheme) engineRef.current?.setMode(resolvedTheme === "dark" ? "night" : "day");
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={skyBackgroundStyle}
      className={`${skyBackgroundClass} ${className}`}
    />
  );
}
