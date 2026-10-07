"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { projects, type Project } from "@/data/projects";
import { Reveal } from "./Reveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Keep in sync with the media query in globals.css
const STACK_QUERY = "(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";
const STICKY_BASE = 96; // 6rem, in px
const STICKY_STEP = 16; // 1rem, in px

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cover = project.images[0];
  const tags = project.stack.flatMap((g) => g.items).slice(0, 5);

  return (
    <article
      data-stack-inner
      data-cursor="View"
      className="group relative origin-top overflow-hidden rounded-3xl border border-foreground/10 bg-card p-4 transition-colors hover:border-primary/50 md:p-6"
    >
      {cover && (
        <div className="overflow-hidden rounded-2xl border border-foreground/10">
          <Image
            src={cover.src}
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            sizes="(min-width: 1152px) 1100px, 100vw"
            className="aspect-video w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02] lg:aspect-auto lg:h-[40vh]"
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-8">
        <p className="font-mono text-sm text-primary">{String(index + 1).padStart(2, "0")}</p>
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
          className="grid size-12 place-items-center rounded-full bg-primary text-background transition-transform group-hover:rotate-45"
        >
          <ArrowUpRight className="size-5" />
        </span>
      </div>

      {/* Dimmed as the next card covers this one */}
      <div
        data-stack-shade
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-background opacity-0"
      />
    </article>
  );
}

export function SelectedWork() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(STACK_QUERY, () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-stack-item]");
        const header = root.current?.querySelector("[data-stack-header]");

        if (header && items[0]) {
          gsap.to(header, {
            opacity: 0,
            y: 0,
            scale: 0.97,
            ease: "none",
            scrollTrigger: {
              trigger: items[0],
              start: "top 25%",
              end: `top ${STICKY_BASE}px`,
              scrub: true,
            },
          });
        }

        items.forEach((item, i) => {
          const next = items[i + 1];
          if (!next) return; // the last card has nothing covering it

          const inner = item.querySelector("[data-stack-inner]");
          const shade = item.querySelector("[data-stack-shade]");

          gsap
            .timeline({
              scrollTrigger: {
                trigger: next,
                start: "top bottom",
                end: `top ${STICKY_BASE + (i + 1) * STICKY_STEP}px`,
                scrub: true,
              },
            })
            .to(inner, { scale: 0.94, ease: "none" }, 0)
            .to(shade, { opacity: 0.55, ease: "none" }, 0);
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="work" className="scroll-mt-28 border-t border-foreground/10 py-24">
      <Reveal className="stack-header">
        <div data-stack-header>
          <p className="font-mono text-sm text-primary">{"//"} 01 – work</p>
          <h2 className="font-display text-4xl font-bold md:text-6xl">Selected Work</h2>
        </div>
      </Reveal>

      <ul className="stack-list mt-12 grid gap-8">
        {projects.map((p, i) => (
          <li key={p.slug} data-stack-item className="stack-card" style={{ "--stack-i": i } as React.CSSProperties}>
            <ProjectCard project={p} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
