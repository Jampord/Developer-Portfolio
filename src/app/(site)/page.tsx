import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { SelectedWork } from "@/components/SelectedWork";
import { site } from "@/lib/site";
import { siteUrl } from "@/lib/url";

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: site.name,
          jobTitle: site.title,
          url: siteUrl,
          sameAs: [site.links.github, site.links.linkedin],
        }}
      />
      {/* The hero is full width for its sky; everything below sits in the page column */}
      <Hero />
      <div className="mx-auto w-[calc(100%-2rem)] max-w-6xl">
        <About />
        <SelectedWork />
        <Experience />
        <Contact />
      </div>
    </>
  );
}
