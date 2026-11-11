import Link from "next/link";
import { site } from "@/lib/site";
import { en } from "../content/en";

export function LabFooter() {
  const t = en.footer;
  return (
    <footer className="mx-auto w-[calc(100%-2rem)] max-w-6xl border-t border-foreground/10 py-8">
      <div className="flex flex-col gap-4 font-mono text-xs text-muted md:flex-row md:items-center md:justify-between">
        <p>{t.note(site.name)}</p>
        <nav aria-label={t.linksLabel}>
          <ul className="flex gap-6">
            <li>
              <Link className="hover:text-primary" href="/">
                {t.links.portfolio}
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary" href="/projects/deskcloud">
                {t.links.caseStudy}
              </Link>
            </li>
            <li>
              <a className="hover:text-primary" href={site.links.github} target="_blank" rel="noopener noreferrer">
                {t.links.github}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
