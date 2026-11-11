import { Reveal } from "@/components/Reveal";
import { en } from "../content/en";
import { SECTION_CLASS, SectionHeading } from "./SectionHeading";

/** The "Join the waitlist" target. The sign-up form replaces the note in the waitlist PR. */
export function WaitlistSection() {
  const t = en.waitlist;
  return (
    <section id="waitlist" aria-labelledby="waitlist-title" className={SECTION_CLASS}>
      <SectionHeading id="waitlist-title" eyebrow={t.eyebrow} title={t.title} />
      <Reveal className="mt-12 grid gap-6 lg:grid-cols-[2fr_3fr]">
        <p className="text-lg">{t.body}</p>
        <p className="rounded-3xl border border-dashed border-primary/40 p-6 font-mono text-sm text-muted">
          {t.comingSoon}
        </p>
      </Reveal>
    </section>
  );
}
