import { experience } from "@/data/profile";
import { Reveal } from "./Reveal";

export function Experience() {
  return (
    <section id="experience" className="scroll-mt-28 border-t border-foreground/10 py-24">
      <Reveal>
        <p className="font-mono text-sm text-primary">{"//"} 03 – experience</p>
        <h2 className="font-display text-4xl font-bold md:text-6xl">Experience</h2>
      </Reveal>

      <Reveal>
        <ol className="mt-12 space-y-12 border-l border-foreground/15 pl-6 md:pl-10">
          {experience.map((job) => (
            <li key={`${job.company}-${job.period}`} className="relative">
              <span
                aria-hidden="true"
                className="absolute left-[-1.9rem] top-2 size-3 rounded-full bg-primary ring-4 ring-background md:left-[-2.9rem]"
              />
              <p className="font-mono text-sm text-primary">{job.period}</p>
              <h3 className="mt-1 font-display text-2xl font-bold md:text-3xl">{job.role}</h3>
              <p className="text-muted">{job.company}</p>
              <ul className="mt-6 max-w-3xl list-disc space-y-2 pl-5 marker:text-primary">
                {job.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
