"use client";

import { useEffect, useRef } from "react";
import { en } from "../content/en";
import type { DesktopIconData } from "../icons";
import { ICON_SIZE, type Direction } from "../slots";

/** Pointer travel before a press counts as a drag, in px */
const DRAG_THRESHOLD = 5;

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const WIGGLE: Keyframe[] = [
  { transform: "rotate(0deg)" },
  { transform: "rotate(-9deg)" },
  { transform: "rotate(8deg)" },
  { transform: "rotate(-5deg)" },
  { transform: "rotate(3deg)" },
  { transform: "rotate(0deg)" },
];

export type DesktopIconHandlers = {
  /** Return false to refuse the drag (another icon is already being dragged) */
  onDragStart(id: string): boolean;
  /** Where the icon's top-left would be, following the pointer */
  onDragMove(id: string, x: number, y: number): void;
  onDragEnd(id: string): void;
  onOpen(id: string): void;
  onMove(id: string, direction: Direction): void;
};

type Props = DesktopIconHandlers & {
  icon: DesktopIconData;
  /** Top-left of the icon box, in desktop px */
  x: number;
  y: number;
  dragging: boolean;
  /** Bumped each time a decorative icon is opened, to replay the wiggle */
  wiggle: number;
};

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  dragging: boolean;
};

export function DesktopIcon({ icon, x, y, dragging, wiggle, ...handlers }: Props) {
  const tile = useRef<HTMLSpanElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const pointerType = useRef("mouse");
  /** Set when the latest press became a drag, so its click can't complete a double-click */
  const dragged = useRef(false);
  const Glyph = icon.glyph;

  useEffect(() => {
    if (!wiggle || !tile.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    tile.current.animate(WIGGLE, { duration: 450, easing: "ease-in-out" });
  }, [wiggle]);

  const finish = (e: React.PointerEvent<HTMLButtonElement>, canOpen: boolean) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.pointerId) return;
    gesture.current = null;
    if (g.dragging) handlers.onDragEnd(icon.id);
    else if (canOpen && pointerType.current !== "mouse") handlers.onOpen(icon.id); // a tap opens on touch and pen
  };

  return (
    <button
      type="button"
      aria-label={en.demo.iconName(icon.label)}
      onPointerDown={(e) => {
        if (e.button !== 0 || gesture.current) return; // primary button, one pointer at a time
        pointerType.current = e.pointerType;
        dragged.current = false;
        gesture.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          originX: x,
          originY: y,
          dragging: false,
        };
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Capture is a nicety; the drag still works without it
        }
      }}
      onPointerMove={(e) => {
        const g = gesture.current;
        if (!g || e.pointerId !== g.pointerId) return;
        const dx = e.clientX - g.startX;
        const dy = e.clientY - g.startY;
        if (!g.dragging) {
          if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
          if (!handlers.onDragStart(icon.id)) {
            gesture.current = null;
            return;
          }
          g.dragging = true;
          dragged.current = true;
        }
        handlers.onDragMove(icon.id, g.originX + dx, g.originY + dy);
      }}
      onPointerUp={(e) => finish(e, true)}
      onPointerCancel={(e) => finish(e, false)}
      onLostPointerCapture={(e) => finish(e, false)}
      onDoubleClick={() => {
        // Mouse only: touch opens on tap, and a press that dragged isn't an open
        if (pointerType.current === "mouse" && !dragged.current) handlers.onOpen(icon.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!e.repeat) handlers.onOpen(icon.id);
          return;
        }
        const direction = KEY_DIRECTIONS[e.key];
        if (direction) {
          e.preventDefault(); // don't scroll the page
          handlers.onMove(icon.id, direction);
        }
      }}
      onContextMenu={(e) => {
        // A long press on touch shouldn't pop up the browser menu mid-drag
        if (pointerType.current !== "mouse") e.preventDefault();
      }}
      className={`absolute left-0 top-0 flex touch-none select-none flex-col items-center gap-1.5 rounded-xl px-1 pt-2 [-webkit-touch-callout:none] hover:bg-white/15 focus-visible:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        dragging ? "z-10 cursor-grabbing bg-white/20" : "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out"
      }`}
      style={{
        width: ICON_SIZE.width,
        height: ICON_SIZE.height,
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }}
    >
      <span
        ref={tile}
        className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-white/90 text-sky-800 shadow-md ${dragging ? "scale-105" : ""}`}
      >
        <Glyph aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </span>
      <span className="line-clamp-2 rounded-md bg-sky-950/45 px-1.5 py-0.5 text-center text-xs font-medium leading-tight text-white">
        {icon.label}
      </span>
    </button>
  );
}
