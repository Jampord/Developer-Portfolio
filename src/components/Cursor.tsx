"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { duration, ease } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

type Mode = "default" | "link" | "view" | "hidden";

/** The ring is drawn once at this size, in px, and scaled from there (see the size-10 class below) */
const RING = 40;

/** How wide the ring looks in each mode, in px */
const SIZES: Record<Mode, number> = {
  default: 24,
  link: 40,
  view: 56,
  hidden: 0,
};

export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const el = root.current;
      const circle = ring.current;
      const text = label.current;
      if (!el || !circle || !text) return;

      gsap.set(circle, { scale: SIZES.default / RING });
      const xTo = gsap.quickTo(el, "x", { duration: 0.01, ease: ease.enter });
      const yTo = gsap.quickTo(el, "y", { duration: 0.01, ease: ease.enter });

      let placed = false;
      let current = "";

      const setMode = (next: Mode, labelText = "") => {
        const key = `${next}:${labelText}`;
        if (key === current) return;
        current = key;
        el.dataset.mode = next;
        text.textContent = labelText;
        // Only scale and opacity change, so resizing the ring never triggers layout
        const tween = { duration: duration.slow, ease: ease.enter, overwrite: "auto" } as const;
        gsap.to(circle, { scale: SIZES[next] / RING, ...tween });
        gsap.to(el, { opacity: next === "hidden" ? 0 : 1, ...tween });
      };

      const onMove = (e: PointerEvent) => {
        if (!placed) {
          gsap.set(el, { x: e.clientX, y: e.clientY });
          placed = true;
        }
        xTo(e.clientX);
        yTo(e.clientY);

        const target = e.target instanceof Element ? e.target : null;
        if (target?.closest("input, textarea, select")) return setMode("hidden");

        const view = target?.closest<HTMLElement>("[data-cursor]");
        if (view) return setMode("view", view.dataset.cursor ?? "");

        if (target?.closest("a, button, [role='button'], summary")) return setMode("link");

        setMode("default");
      };

      const onLeave = () => setMode("hidden");
      const onEnter = () => {
        current = "";
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
      document.documentElement.addEventListener("mouseenter", onEnter);

      return () => {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
        document.documentElement.removeEventListener("mouseenter", onEnter);
        gsap.set(el, { opacity: 0 });
      };
    });

    return () => mm.revert();
  });

  return (
    // A point that follows the pointer; the ring and its label are centred on it
    <div
      ref={root}
      aria-hidden="true"
      data-mode="default"
      className="group pointer-events-none fixed left-0 top-0 z-100 size-0 opacity-0"
    >
      {/* The border is drawn a little heavy because the ring is usually scaled down */}
      <div
        ref={ring}
        className="absolute -left-5 -top-5 size-10 rounded-full border-[1.5px] border-primary transition-colors duration-(--duration-base) group-data-[mode=link]:bg-primary/15 group-data-[mode=view]:bg-primary"
      />
      <span
        ref={label}
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 font-mono text-xs font-medium text-background opacity-0 transition-opacity duration-(--duration-base) group-data-[mode=view]:opacity-100"
      />
    </div>
  );
}
