import Link from "next/link";
import { site } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";
import { PaletteTrigger } from "./PaletteTrigger";

export function Nav() {
  return (
    <header className="sticky top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-6xl pt-4">
      <nav
        aria-label="Main"
        className="flex items-center justify-between rounded-full border border-foreground/10 bg-card/80 py-2 pl-2 pr-2 backdrop-blur-md"
      >
        <Link href="/" aria-label={`${site.name}, home`} className="flex items-center gap-2 pr-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-sm font-extrabold text-background">
            {site.shortName}
          </span>
          <span className="hidden font-mono text-xs text-muted sm:block">{site.title}</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {site.nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="rounded-full px-4 py-2 text-sm transition-colors hover:bg-foreground/5">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <PaletteTrigger />
          <ThemeToggle />
          <Link
            href="/#contact"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Let&apos;s talk
          </Link>
        </div>
      </nav>
    </header>
  );
}
