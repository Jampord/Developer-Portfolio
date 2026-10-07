"use client";

import { Fragment, useRef } from "react";
import Link from "next/link";
import { ArrowDown, Download } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const nameLines = ["John Ford", "Actub"];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const tail = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Intro
        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .fromTo(
            "[data-hero-tile]",
            { scale: 0.6, rotate: -30, opacity: 0 },
            { scale: 1, rotate: 0, opacity: 1, duration: 1.1, ease: "back.out(1.7)" },
          )
          .fromTo("[data-hero-char]", { yPercent: 110, opacity: 1 }, { yPercent: 0, duration: 1, stagger: 0.035 }, 0.15)
          .fromTo(
            "[data-hero-fade]",
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
            "-=0.6",
          );

        // Drift as you scroll away (transform-only, so it stays cheap)
        const scrub = {
          trigger: root.current,
          start: 0,
          end: "+=600",
          scrub: true,
        };
        gsap.to(name.current, { y: -80, ease: "none", scrollTrigger: scrub });
        gsap.to(tail.current, { y: -40, ease: "none", scrollTrigger: scrub });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="flex min-h-[80vh] flex-col justify-center gap-10 pb-16 pt-12 md:pt-20">
      {/* If JavaScript is off, show everything */}
      <noscript>
        <style>{`[data-hero-char],[data-hero-fade],[data-hero-tile]{opacity:1!important}`}</style>
      </noscript>

      <div className="flex items-center gap-4">
        {/* Outer div holds the static tilt; inner div is animated */}
        <div className="-rotate-6">
          <div
            data-hero-tile
            aria-hidden="true"
            className="grid size-20 place-items-center rounded-3xl bg-primary font-display text-3xl font-extrabold text-background md:size-28 md:text-5xl"
          >
            {site.shortName}
          </div>
        </div>
        <p data-hero-fade className="font-mono text-sm text-primary">
          {"//"} {site.title}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
        <h1
          ref={name}
          aria-label={site.name}
          className="font-display text-[clamp(3rem,10vw,8.5rem)] font-extrabold uppercase leading-[0.9] tracking-tight"
        >
          {nameLines.map((line) => (
            <span key={line} aria-hidden="true" className="block">
              {line.split(" ").map((word, wi, words) => (
                <Fragment key={`${line}-${word}`}>
                  <span className="mb-[-0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                    {[...word].map((char, ci) => (
                      <span key={`${word}-${ci}`} data-hero-char className="inline-block">
                        {char}
                      </span>
                    ))}
                  </span>
                  {wi < words.length - 1 && " "}
                </Fragment>
              ))}
            </span>
          ))}
        </h1>

        <div ref={tail} className="max-w-xs space-y-6">
          <p data-hero-fade className="text-lg text-muted">
            {site.tagline}
          </p>
          <div data-hero-fade className="flex flex-wrap gap-3">
            <Link
              href="/#work"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              View my work
              <ArrowDown className="size-4" aria-hidden="true" />
            </Link>
            <a
              href={site.cvPath}
              download
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-5 py-3 text-sm font-medium transition-colors hover:bg-foreground/5"
            >
              Download CV
              <Download className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
