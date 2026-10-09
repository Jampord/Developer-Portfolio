"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function HeroDrift() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const scrub = {
        trigger: document.documentElement,
        start: 0,
        end: "+=600",
        scrub: true,
      };
      gsap.to("[data-hero-name]", { y: -80, ease: "none", scrollTrigger: scrub });
      gsap.to("[data-hero-tail]", { y: -40, ease: "none", scrollTrigger: scrub });
    });

    return () => mm.revert();
  });

  return null;
}
