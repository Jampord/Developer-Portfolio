import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Hero } from "@/components/Hero";
import { SelectedWork } from "@/components/SelectedWork";

export default function Home() {
  return (
    <div className="mx-auto w-[calc(100%-2rem)] max-w-6xl">
      <Hero />
      <SelectedWork />
      <About />
      <Experience />
      <Contact />
    </div>
  );
}
