import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowDown, Download } from "lucide-react";
import { SKY_OBSTACLE_ATTR } from "@/lib/hero-sky";
import { site } from "@/lib/site";
import { HeroIcons } from "./HeroIcons";
import { LazyHeroSky } from "./LazyHeroSky";
import { SkyCaption } from "./SkyCaption";

const nameLines = ["John Ford", "Actub"];

// Split once at import time; each letter keeps a running index for its stagger delay
let n = 0;
const nameWords = nameLines.map((line) =>
  line.split(" ").map((word) => [...word].map((char) => ({ char, index: n++ }))),
);

/** Marks an element as a box the sky's clouds part around */
const skyObstacle = { [SKY_OBSTACLE_ATTR]: "" };

// Text sits on the sky, so anything small gets a frosted surface to stay readable
const surface = "border border-foreground/10 bg-card/90 backdrop-blur-md";

export function Hero() {
  return (
    // Full width, so the sky runs edge to edge; the content keeps the page's column
    <section className="relative isolate">
      <LazyHeroSky />

      <div className="mx-auto flex min-h-[88svh] w-[calc(100%-2rem)] max-w-6xl flex-col justify-center gap-10 pb-28 pt-12 md:pt-20">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
          {/* An obstacle too, so the sun or moon never sits behind the tile */}
          <div className="flex items-center gap-4" {...skyObstacle}>
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
            <p data-hero-slide className={`rounded-2xl px-3 py-1.5 font-mono text-sm text-primary ${surface}`}>
              {"//"} {site.label}
            </p>
          </div>

          {/* Above the rest of the hero, so a dragged icon passes over the headline and the card */}
          <div data-hero-fade className="relative z-10 w-full sm:w-auto">
            <HeroIcons />
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
          <h1
            aria-label={site.name}
            className="font-display text-[clamp(3rem,10vw,8.5rem)] font-extrabold uppercase leading-[0.9] tracking-tight"
          >
            {nameWords.map((words, li) => (
              // Each line is its own obstacle, sized to its text
              <span key={li} aria-hidden="true" className="block w-fit" {...skyObstacle}>
                {words.map((letters, wi) => (
                  <Fragment key={wi}>
                    <span className="mb-[-0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                      {letters.map(({ char, index }) => (
                        <span
                          key={index}
                          data-hero-char
                          style={{ "--i": index } as CSSProperties}
                          className="inline-block"
                        >
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

          <div data-hero-slide className={`max-w-xs space-y-6 rounded-3xl p-5 ${surface}`}>
            <p className="text-lg text-muted">{site.tagline}</p>
            <div className="flex flex-wrap gap-3">
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

        <SkyCaption />
      </div>
    </section>
  );
}
