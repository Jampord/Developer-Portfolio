"use client";

import { useEffect, useRef } from "react";
import { createEngine, type Engine } from "../engine/engine";
import type { Rect } from "../engine/types";
import { sky } from "../themes";

const MAX_DPR = 2;

type Props = {
  /** Icon bounds relative to the canvas, in CSS px */
  obstacles: readonly Rect[];
  className?: string;
};

/** Owns the <canvas> and the engine instance; purely decorative, all interaction lives on the HTML above it */
export function DeskcloudCanvas({ obstacles, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createEngine(canvas, { theme: sky });
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

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
