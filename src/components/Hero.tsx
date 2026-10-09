import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowDown, Download } from "lucide-react";
import { site } from "@/lib/site";
import { HeroDrift } from "./HeroDrift";

const nameLines = ["John Ford", "Actub"];

// Split once at import time; each letter keeps a running index for its stagger delay
let n = 0;
const nameWords = nameLines.map((line) =>
  line.split(" ").map((word) => [...word].map((char) => ({ char, index: n++ }))),
);

export function Hero() {
  return (
    <section className="flex min-h-[80vh] flex-col justify-center gap-10 pb-16 pt-12 md:pt-20">
      <HeroDrift />

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
        <p data-hero-slide className="font-mono text-sm text-primary">
          {"//"} {site.title}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
        <h1
          data-hero-name
          aria-label={site.name}
          className="font-display text-[clamp(3rem,10vw,8.5rem)] font-extrabold uppercase leading-[0.9] tracking-tight"
        >
          {nameWords.map((words, li) => (
            <span key={li} aria-hidden="true" className="block">
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

        <div data-hero-tail className="max-w-xs space-y-6">
          <p data-hero-slide className="text-lg text-muted">
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
