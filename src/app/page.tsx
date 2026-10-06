import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { Hero } from "@/components/Hero";
import { SelectedWork } from "@/components/SelectedWork";

const sections = [{ id: "contact", label: "// 04 – contact", title: "Let's talk" }];

export default function Home() {
  return (
    <div className="mx-auto w-[calc(100%-2rem)] max-w-6xl">
      <Hero />
      <SelectedWork />
      <About />
      <Experience />

      {sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-28 border-t border-foreground/10 py-24">
          <p className="font-mono text-sm text-primary">
            {"//"} {s.label.replace("// ", "")}
          </p>
          <h2 className="font-display text-4xl font-bold md:text-6xl">{s.title}</h2>
        </section>
      ))}
    </div>
  );
}
