import { Reveal } from "@/components/Reveal";
import { en } from "../content/en";
import { SECTION_CLASS, SectionHeading } from "./SectionHeading";

export function HowItWorks() {
  const t = en.howItWorks;
  return (
    <section aria-labelledby="how-it-works-title" className={SECTION_CLASS}>
      <SectionHeading id="how-it-works-title" eyebrow={t.eyebrow} title={t.title} />
      <ol className="mt-12 grid gap-4 md:grid-cols-3">
        {t.steps.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={i * 0.1} className="h-full">
              <div className="card-depth h-full rounded-3xl border border-foreground/10 bg-card p-6">
                <p className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-muted">{step.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
