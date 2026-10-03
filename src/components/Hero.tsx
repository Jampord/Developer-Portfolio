import Link from "next/link";
import { ArrowDown, Download } from "lucide-react";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="flex min-h-[80vh] flex-col justify-center gap-10 pb-16 pt-12 md:pt-20">
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="grid size-20 -rotate-6 place-items-center rounded-3xl bg-primary font-display text-3xl font-extrabold text-background md:size-28 md:text-5xl"
        >
          {site.shortName}
        </div>
        <p className="font-mono text-sm text-primary">
          {"//"} {site.title}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
        <h1 className="font-display text-[clamp(3rem,10vw,8.5rem)] font-extrabold uppercase leading-[0.9] tracking-tight">
          <span className="block">John Ford</span>
          <span className="block">Actub</span>
        </h1>

        <div className="max-w-xs space-y-6">
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
    </section>
  );
}
