import { BatteryFull, MoonStar, ScanEye, Wind, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { en } from "../content/en";
import { SECTION_CLASS, SectionHeading } from "./SectionHeading";

/** One glyph per feature card, in the same order as the copy */
const GLYPHS: readonly LucideIcon[] = [ScanEye, Wind, BatteryFull, MoonStar];

export function Features() {
  const t = en.features;
  return (
    <section aria-labelledby="features-title" className={SECTION_CLASS}>
      <SectionHeading id="features-title" eyebrow={t.eyebrow} title={t.title} />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.items.map((item, i) => {
          const Glyph = GLYPHS[i];
          return (
            <li key={item.title}>
              <Reveal delay={i * 0.08} className="h-full">
                <div className="card-depth h-full rounded-3xl border border-foreground/10 bg-card p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Glyph className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-muted">{item.body}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
