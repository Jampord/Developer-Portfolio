import { site } from "@/lib/site";
import { ProfileViews } from "./ProfileViews";

export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-[calc(100%-2rem)] max-w-6xl border-t border-foreground/10 py-8">
      <div className="flex flex-col gap-4 font-mono text-xs text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <ProfileViews />
        </div>
        <ul className="flex gap-6">
          <li>
            <a className="tap-target hover:text-primary" href={site.links.github}>
              GitHub
            </a>
          </li>
          <li>
            <a className="tap-target hover:text-primary" href={site.links.linkedin}>
              LinkedIn
            </a>
          </li>
          <li>
            <a className="tap-target hover:text-primary" href={`mailto:${site.email}`}>
              Email
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
