import { bio, exploring, skillGroups } from "@/data/profile";

export function About() {
  return (
    <section id="about" className="scroll-mt-28 border-t border-foreground/10 py-24">
      <p className="font-mono text-sm text-primary">{"//"} 02 – about</p>
      <h2 className="font-display text-4xl font-bold md:text-6xl">About &amp; Capabilities</h2>

      <div className="mt-12 grid gap-12 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-5 text-lg">
          {bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {skillGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-foreground/10 bg-card p-6">
              <h3 className="font-mono text-xs text-primary">
                {"//"} {group.title.toLowerCase()}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item} className="rounded-full border border-foreground/10 px-3 py-1 text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-3xl border border-dashed border-primary/40 p-6 sm:col-span-2">
            <h3 className="font-mono text-xs text-primary">{"//"} currently exploring</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {exploring.map((item) => (
                <li key={item} className="rounded-full bg-primary/10 px-3 py-1 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
