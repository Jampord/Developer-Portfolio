import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { en } from "../content/en";
import { LazyDemoDesktop } from "./LazyDemoDesktop";
import { LiveSkyLine } from "./LiveSkyLine";

/**
 * Headline, subhead and CTAs are server-rendered (good for SEO and LCP). The live demo
 * below loads on the client, behind a same-size sky placeholder.
 */
export function DeskcloudHero() {
  const t = en.hero;
  return (
    <section aria-labelledby="deskcloud-title" className="pb-24 pt-10 md:pt-16">
      <div className="max-w-4xl space-y-6">
        <p className="font-mono text-sm text-primary">{t.eyebrow}</p>
        <h1
          id="deskcloud-title"
          className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-tight"
        >
          {t.title}
        </h1>
        <p className="max-w-2xl text-lg text-muted">{t.subhead}</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t.primaryCta}
            <ArrowDown className="size-4" aria-hidden="true" />
          </a>
          <Link
            href="/projects/deskcloud"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-5 py-3 text-sm font-medium transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t.secondaryCta}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mt-12">
        <p className="mb-3 font-mono text-xs text-muted">{t.hint}</p>
        <div className="overflow-hidden rounded-4xl border border-foreground/10 shadow-xl">
          <LazyDemoDesktop />
        </div>
        <LiveSkyLine />
      </div>
    </section>
  );
}
