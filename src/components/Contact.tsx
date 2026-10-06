import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/site";
import { ContactForm } from "./ContactForm";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-28 border-t border-foreground/10 py-24">
      <p className="font-mono text-sm text-primary">{"//"} 04 – contact</p>
      <h2 className="font-display text-4xl font-bold md:text-6xl">Let&apos;s talk</h2>

      <div className="mt-12 grid gap-12 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-6">
          <p className="text-lg">
            Have a role, a project or just a question? Send a message and I&apos;ll get back to you.
          </p>
          <ul className="space-y-3">
            {[
              { label: "Email", href: `mailto:${site.email}`, text: site.email },
              { label: "GitHub", href: site.links.github, text: "GitHub" },
              { label: "LinkedIn", href: site.links.linkedin, text: "LinkedIn" },
            ].map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="group inline-flex items-center gap-2 font-display text-xl font-bold transition-colors hover:text-primary"
                  {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {l.text}
                  <ArrowUpRight className="size-5 transition-transform group-hover:rotate-45" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
