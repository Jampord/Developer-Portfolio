"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { featuredProjects, otherProjects, SCREENSHOT_QUALITY, type Project } from "@/data/projects";
import { isPortrait, splitCover } from "@/lib/screenshots";
import { PhoneScreens } from "./PhoneScreens";
import { Reveal } from "./Reveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Keep in sync with the media query in globals.css
const DECK_QUERY = "(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";

const pad = (n: number) => String(n).padStart(2, "0");

// How a card sits when it is `depth` cards down the deck: each one peeks out above the card in
// front of it, a touch smaller and slightly askew, like a deck that was squared up by hand
const pose = (depth: number) => ({
  xPercent: 0,
  y: -14 * depth,
  scale: 1 - 0.035 * depth,
  rotation: depth === 0 ? 0 : depth % 2 ? -1.2 : 1,
});

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { cover } = splitCover(project.images);
  const isPhoneCover = cover.length > 0 && isPortrait(cover[0]);
  const tags = project.stack.flatMap((g) => g.items).slice(0, 5);

  return (
    <article
      data-cursor="View"
      className="group relative h-full overflow-hidden rounded-3xl border border-foreground/10 bg-card p-4 transition-colors hover:border-primary/50 md:p-6"
    >
      {cover.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-foreground/10">
          {isPhoneCover ? (
            // Same box as a desktop cover; the phones are cropped at the bottom
            <PhoneScreens
              images={cover}
              sizes="(min-width: 1152px) 300px, (min-width: 640px) 28vw, 40vw"
              className="work-cover aspect-video px-4 pt-4 transition-transform duration-500 group-hover:scale-[1.02] sm:px-8 sm:pt-6 lg:aspect-auto lg:h-[40vh]"
              phoneClassName="w-[40%] max-w-[300px] sm:w-[28%]"
            />
          ) : (
            <Image
              src={cover[0].src}
              alt={cover[0].alt}
              width={cover[0].width}
              height={cover[0].height}
              sizes="(min-width: 1152px) 1100px, 100vw"
              quality={SCREENSHOT_QUALITY}
              className="work-cover aspect-video w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02] lg:aspect-auto lg:h-[40vh]"
            />
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-8">
        <p className="font-mono text-sm text-primary">{pad(index + 1)}</p>
        <div className="space-y-3">
          <h3 className="font-display text-3xl font-bold md:text-4xl">
            <Link
              href={`/projects/${project.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {project.title}
            </Link>
          </h3>
          <p className="max-w-2xl text-muted">{project.summary}</p>
          <ul className="flex flex-wrap gap-2 pt-1">
            {tags.map((t) => (
              <li key={t} className="rounded-full border border-foreground/10 px-3 py-1 font-mono text-xs text-muted">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:rotate-45"
        >
          <ArrowUpRight className="size-5" />
        </span>
      </div>
    </article>
  );
}

export function SelectedWork() {
  const root = useRef<HTMLElement>(null);
  const total = featuredProjects.length;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(DECK_QUERY, () => {
        const section = root.current;
        const run = section?.querySelector<HTMLElement>("[data-work-run]");
        const deck = section?.querySelector<HTMLElement>("[data-work-deck]");
        const bar = section?.querySelector<HTMLElement>("[data-work-bar]");
        const count = section?.querySelector<HTMLElement>("[data-work-count]");
        if (!run || !deck) return;

        const cards = gsap.utils.toArray<HTMLElement>("[data-work-item]", deck);
        const n = cards.length;
        if (n < 2) return;

        // The deck as dealt: first project on top
        cards.forEach((card, j) => gsap.set(card, { ...pose(j), zIndex: n - j, transformOrigin: "50% 0%" }));

        // One shuffle per step of scroll: the top card is drawn off to the side and slipped in at
        // the back, while the rest of the deck moves up one place. Only that one card travels.
        const shuffle = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: run,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
              if (bar) gsap.set(bar, { scaleX: self.progress });
              if (count) count.textContent = pad(Math.round(self.progress * (n - 1)) + 1);
            },
          },
        });

        for (let s = 0; s < n - 1; s++) {
          const top = cards[s];

          shuffle
            .to(top, { xPercent: 104, y: -8, rotation: 5, duration: 0.5 }, s)
            // It has cleared the deck, so it can go behind without cutting through anything
            .set(top, { zIndex: -s }, s + 0.5)
            .to(top, { ...pose(n - 1), duration: 0.5 }, s + 0.5);

          cards.forEach((card, j) => {
            if (j === s) return;
            const depth = (j - s + n) % n;
            shuffle.to(card, { ...pose(depth - 1), duration: 0.6 }, s + 0.3);
          });
        }

        // Tabbing to a card that is buried in the deck scrolls to the point where it is on top
        const onFocus = (e: FocusEvent) => {
          const card = (e.target as HTMLElement).closest<HTMLElement>("[data-work-item]");
          const st = shuffle.scrollTrigger;
          const j = card ? cards.indexOf(card) : -1;
          if (j < 0 || !st) return;

          const top = st.start + (j / (n - 1)) * (st.end - st.start);
          if (Math.abs(window.scrollY - top) > 4) window.scrollTo({ top });
        };
        deck.addEventListener("focusin", onFocus);

        return () => deck.removeEventListener("focusin", onFocus);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="work" className="scroll-mt-28 border-t border-foreground/10 py-24">
      <div data-work-run className="work-run" style={{ "--work-steps": total - 1 } as React.CSSProperties}>
        <div className="work-pin">
          <div>
            <Reveal>
              <p className="font-mono text-sm text-primary">{"//"} 01 – work</p>
              <h2 className="font-display text-4xl font-bold md:text-6xl">Selected Work</h2>
            </Reveal>

            {/* Which card is on top; only shown where the cards are a deck */}
            <div aria-hidden="true" className="work-progress">
              <p className="font-mono text-sm text-muted">
                <span data-work-count className="text-primary">
                  {pad(1)}
                </span>{" "}
                / {pad(total)}
              </p>
              <div className="h-px flex-1 bg-foreground/15">
                <div data-work-bar className="h-px origin-left scale-x-0 bg-primary" />
              </div>
            </div>
          </div>

          <ul data-work-deck className="work-list mt-12 grid gap-8">
            {featuredProjects.map((p, i) => (
              <li key={p.slug} data-work-item className="work-item">
                <ProjectCard project={p} index={i} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {otherProjects.length > 0 && (
        <Reveal className="mt-16">
          <p className="font-mono text-sm text-primary">{"//"} also built</p>
          <ul className="mt-4 grid gap-x-8 gap-y-6 md:grid-cols-2">
            {otherProjects.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="group/also inline-flex items-center gap-1 font-display text-xl font-bold hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {p.title}
                  <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover/also:rotate-45" />
                </Link>
                <p className="mt-1 text-sm text-muted">{p.summary}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </section>
  );
}
