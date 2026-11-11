import { Reveal } from "@/components/Reveal";

type Props = { id: string; eyebrow: string; title: string };

/** The portfolio's section heading style: a mono label over a display h2 */
export function SectionHeading({ id, eyebrow, title }: Props) {
  return (
    <Reveal>
      <p className="font-mono text-sm text-primary">{eyebrow}</p>
      <h2 id={id} className="font-display text-4xl font-bold md:text-6xl">
        {title}
      </h2>
    </Reveal>
  );
}

/** Shared section frame, matching the homepage sections */
export const SECTION_CLASS = "scroll-mt-8 border-t border-foreground/10 py-24";
