"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function FrameShell({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The page's corners round out as you leave the top
        gsap.fromTo(
          inner.current,
          { borderRadius: "2rem" },
          {
            borderRadius: "3.5rem",
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "+=500",
              scrub: true,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: outer },
  );

  return (
    <div ref={outer} className="min-h-screen bg-frame p-3 md:p-6">
      <div
        ref={inner}
        style={{ borderRadius: "2rem" }}
        className="min-h-[calc(100vh-1.5rem)] bg-background md:min-h-[calc(100vh-3rem)]"
      >
        {children}
      </div>
    </div>
  );
}
