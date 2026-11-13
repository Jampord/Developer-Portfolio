"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { featuredProjects, type Project } from "@/data/projects";
import { SKY_OBSTACLE_ATTR, SKY_OBSTACLES_EVENT } from "@/lib/hero-sky";
import { site } from "@/lib/site";

type Offset = { x: number; y: number };

/** Pointer travel before a press counts as a drag, in px */
const DRAG_THRESHOLD = 5;
/** Distance one arrow-key press moves an icon, in px */
const KEY_STEP = 16;

const KEY_DIRECTIONS: Record<string, Offset> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  origin: Offset;
  dragging: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * A project as a desktop icon. It's a normal link (click, tap or Enter opens the case study)
 * that a mouse or pen can also drag around the sky. Touch never drags, so the page still scrolls.
 */
function HeroIcon({ project }: { project: Project & { icon: NonNullable<Project["icon"]> } }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const gesture = useRef<Gesture | null>(null);
  /** Set when the latest press became a drag, so its click doesn't follow the link */
  const dragged = useRef(false);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const Glyph = project.icon.glyph;

  // Once the new position is in the DOM, let the sky know its obstacles moved
  useEffect(() => {
    ref.current?.dispatchEvent(new CustomEvent(SKY_OBSTACLES_EVENT, { bubbles: true }));
  }, [offset]);

  /** Move to an offset, keeping the whole icon inside the hero section */
  const moveTo = (next: Offset) => {
    const el = ref.current;
    const section = el?.closest("section");
    if (!el || !section) return;
    const box = el.getBoundingClientRect();
    const bounds = section.getBoundingClientRect();
    setOffset((current) => ({
      x: clamp(next.x, current.x - (box.left - bounds.left), current.x + (bounds.right - box.right)),
      y: clamp(next.y, current.y - (box.top - bounds.top), current.y + (bounds.bottom - box.bottom)),
    }));
  };

  const finish = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerId !== gesture.current?.pointerId) return;
    gesture.current = null;
    setDragging(false);
    // The click that ends a drag fires before this; anything later is a real click
    setTimeout(() => (dragged.current = false));
  };

  return (
    <Link
      ref={ref}
      href={`/projects/${project.slug}`}
      draggable={false}
      title={site.tooltips.icon(project.title)}
      {...{ [SKY_OBSTACLE_ATTR]: "" }}
      onPointerDown={(e) => {
        dragged.current = false;
        if (e.button !== 0 || e.pointerType === "touch" || gesture.current) return;
        gesture.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          origin: offset,
          dragging: false,
        };
      }}
      onPointerMove={(e) => {
        const g = gesture.current;
        if (!g || e.pointerId !== g.pointerId) return;
        const dx = e.clientX - g.startX;
        const dy = e.clientY - g.startY;
        if (!g.dragging) {
          if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
          g.dragging = true;
          dragged.current = true;
          setDragging(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Capture is a nicety; the drag still works without it
          }
        }
        moveTo({ x: g.origin.x + dx, y: g.origin.y + dy });
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onClick={(e) => {
        if (dragged.current) e.preventDefault(); // the end of a drag isn't a click
      }}
      onKeyDown={(e) => {
        const direction = KEY_DIRECTIONS[e.key];
        if (!direction) return;
        e.preventDefault(); // don't scroll the page
        moveTo({ x: offset.x + direction.x * KEY_STEP, y: offset.y + direction.y * KEY_STEP });
      }}
      style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      className={`relative flex w-full select-none flex-col items-center gap-1.5 rounded-xl px-1 pb-1.5 pt-2 hover:bg-white/15 focus-visible:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-20 ${
        dragging ? "z-20 cursor-grabbing bg-white/20" : "z-10 motion-safe:transition-colors"
      }`}
    >
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-white/90 text-sky-800 shadow-md ${dragging ? "scale-105" : ""}`}
      >
        <Glyph aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </span>
      <span className="line-clamp-2 rounded-md bg-sky-950/85 px-1.5 py-0.5 text-center text-xs font-medium leading-tight text-white">
        {project.icon.label}
      </span>
    </Link>
  );
}

const hasIcon = (p: Project): p is Project & { icon: NonNullable<Project["icon"]> } => Boolean(p.icon);

/** The featured projects as desktop icons on the hero's sky */
export function HeroIcons({ className = "" }: { className?: string }) {
  // Dragged positions are offsets from the layout, so a new layout starts them over
  const [layout, setLayout] = useState(0);

  useEffect(() => {
    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return; // phones resize vertically as their toolbars hide
      width = window.innerWidth;
      setLayout((n) => n + 1);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <ul aria-label="Projects" className={`grid grid-cols-4 gap-1 sm:flex sm:gap-2 ${className}`}>
      {featuredProjects.filter(hasIcon).map((project, i) => (
        <li key={`${project.slug}-${layout}`} style={{ "--icon-i": i } as CSSProperties}>
          <HeroIcon project={project} />
        </li>
      ))}
    </ul>
  );
}
