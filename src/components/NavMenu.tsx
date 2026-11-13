"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { site } from "@/lib/site";

/**
 * The section links on small screens, where the nav has no room for them: a button that opens a
 * short list under the bar. Escape, a tap outside or choosing a link closes it.
 */
export function NavMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const Icon = open ? X : Menu;

  return (
    <div ref={root} className="md:hidden">
      <button
        ref={button}
        type="button"
        aria-label={open ? site.menu.close : site.menu.open}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="tap-target pressable grid size-9 place-items-center rounded-full border border-foreground/10 hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon
          aria-hidden="true"
          className={`size-4 transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
        />
      </button>

      <ul
        id={id}
        data-open={open ? "" : undefined}
        className="nav-menu absolute right-0 top-full mt-2 w-56 rounded-3xl border border-foreground/10 bg-card p-2 shadow-lg"
      >
        {site.nav.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className="pressable flex min-h-11 items-center rounded-2xl px-4 hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
