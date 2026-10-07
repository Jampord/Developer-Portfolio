"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Mode = "default" | "link" | "view" | "hidden";

const SIZES: Record<Mode, number> = {
  default: 24,
  link: 40,
  view: 56,
  hidden: 0,
};

export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const el = ring.current;
      const text = label.current;
      if (!el || !text) return;

      gsap.set(el, { xPercent: -50, yPercent: -50, width: SIZES.default, height: SIZES.default });
      const xTo = gsap.quickTo(el, "x", { duration: 0.01, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.01, ease: "power3.out" });

      let placed = false;
      let current = "";

      const setMode = (next: Mode, labelText = "") => {
        const key = `${next}:${labelText}`;
        if (key === current) return;
        current = key;
        el.dataset.mode = next;
        text.textContent = labelText;
        gsap.to(el, {
          width: SIZES[next],
          height: SIZES[next],
          opacity: next === "hidden" ? 0 : 1,
          duration: 0.3,
          ease: "power3.out",
          overwrite: "auto",
        });
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
    <div
      ref={ring}
      aria-hidden="true"
      data-mode="default"
      className="group pointer-events-none fixed left-0 top-0 z-100 grid place-items-center rounded-full border border-primary opacity-0 transition-colors duration-200 data-[mode=link]:bg-primary/15 data-[mode=view]:bg-primary"
    >
      <span
        ref={label}
        className="font-mono text-xs font-medium text-background opacity-0 transition-opacity duration-200 group-data-[mode=view]:opacity-100"
      />
    </div>
  );
}
