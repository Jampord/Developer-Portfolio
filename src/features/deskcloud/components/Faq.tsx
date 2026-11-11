import { Plus } from "lucide-react";
import { en } from "../content/en";
import { SECTION_CLASS, SectionHeading } from "./SectionHeading";

/** Native <details>/<summary>: keyboard and screen reader support with no JavaScript */
export function Faq() {
  const t = en.faq;
  return (
    <section aria-labelledby="faq-title" className={SECTION_CLASS}>
      <SectionHeading id="faq-title" eyebrow={t.eyebrow} title={t.title} />
      <div className="mt-12 divide-y divide-foreground/10 border-t border-foreground/10">
        {t.items.map((item) => (
          <details key={item.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:text-xl [&::-webkit-details-marker]:hidden">
              {item.question}
              <Plus
                className="size-5 shrink-0 text-primary transition-transform group-open:rotate-45 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </summary>
            <p className="max-w-3xl pb-6 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
