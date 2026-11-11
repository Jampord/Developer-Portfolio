import { Reveal } from "@/components/Reveal";
import { en } from "../content/en";
import { SECTION_CLASS, SectionHeading } from "./SectionHeading";
import { WaitlistForm } from "./WaitlistForm";

/** The "Join the waitlist" target */
export function WaitlistSection() {
  const t = en.waitlist;
  return (
    <section id="waitlist" aria-labelledby="waitlist-title" className={SECTION_CLASS}>
      <SectionHeading id="waitlist-title" eyebrow={t.eyebrow} title={t.title} />
      <Reveal className="mt-12 grid gap-8 lg:grid-cols-[2fr_3fr]">
        <p className="text-lg">{t.body}</p>
        <WaitlistForm />
      </Reveal>
    </section>
  );
}
