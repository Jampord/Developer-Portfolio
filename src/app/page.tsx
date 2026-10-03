import { Hero } from "@/components/Hero";

const sections = [
  { id: "work", label: "// 01 – work", title: "Selected Work" },
  { id: "about", label: "// 02 – about", title: "About & Capabilities" },
  { id: "experience", label: "// 03 – experience", title: "Experience" },
  { id: "contact", label: "// 04 – contact", title: "Let's talk" },
];

export default function Home() {
  return (
    <div className="mx-auto w-[calc(100%-2rem)] max-w-6xl">
      <Hero />

      {sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-28 border-t border-foreground/10 py-24">
          <p className="font-mono text-sm text-primary">{s.label}</p>
          <h2 className="font-display text-4xl font-bold md:text-6xl">{s.title}</h2>
        </section>
      ))}
    </div>
  );
}
