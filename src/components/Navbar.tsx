import Link from "next/link";
import { site } from "@/lib/site";
import { HomeLink } from "./HomeLink";
import { ThemeToggle } from "./ThemeToggle";
import { NavMenu } from "./NavMenu";
import { PaletteTrigger } from "./PaletteTrigger";

export function Nav() {
  return (
    <header className="sticky top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-6xl pt-4">
      <nav
        aria-label="Main"
        className="relative flex items-center justify-between rounded-full border border-foreground/10 bg-card/80 py-2 pl-2 pr-2 backdrop-blur-md"
      >
        <HomeLink aria-label={`${site.name}, home`} className="tap-target flex items-center gap-2 pr-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-sm font-extrabold text-background">
            {site.shortName}
          </span>
          <span className="hidden font-mono text-xs text-muted sm:block">{site.title}</span>
        </HomeLink>

        <ul className="hidden items-center gap-1 md:flex">
          {site.nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="tap-target pressable rounded-full px-4 py-2 text-sm hover:bg-foreground/5">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* The first thing to go on the narrowest phones: there is no keyboard shortcut to hint at
              there, and the menu button already reaches every section */}
          <div className="contents max-[359px]:hidden">
            <PaletteTrigger />
          </div>
          <ThemeToggle />
          <Link
            href="/#contact"
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground tap-target pressable hover:opacity-90"
          >
            Let&apos;s talk
          </Link>
          <NavMenu />
        </div>
      </nav>
    </header>
  );
}
