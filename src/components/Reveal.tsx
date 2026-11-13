"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ease, stagger } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** The element to render, for when the children need a list around them */
  as?: "div" | "ul" | "ol";
  /** Seconds to wait once it scrolls into view */
  delay?: number;
  /** How far it rises, in px */
  y?: number;
  /** Bring the children in one after another instead of the whole block at once */
  each?: boolean;
};

/**
 * Fades its content in, with a rise, the first time it scrolls into view.
 * With reduced motion the rise is dropped and only the fade is left.
 */
export function Reveal({ children, className, as: Tag = "div", delay = 0, y = 40, each = false }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      // Both queries are listed so the fade still runs for visitors who ask for less motion
      const queries = { move: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" };
      mm.add(queries, (context) => {
        gsap.from(each ? el.children : el, {
          opacity: 0,
          y: context.conditions?.move ? y : 0,
          duration: 0.9,
          delay,
          ease: ease.enter,
          stagger: each ? stagger : 0,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}
