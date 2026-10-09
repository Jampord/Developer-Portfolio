"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FolderOpen,
  Hash,
  Moon,
  Search,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { projects } from "@/data/projects";
import { site } from "@/lib/site";
import { OPEN_PALETTE_EVENT } from "@/lib/command-palette";

type CopyState = "idle" | "done" | "failed";

function PaletteItem({
  icon: Icon,
  label,
  value,
  hint,
  keywords,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  keywords?: string[];
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {hint && <span className="font-mono text-xs text-muted">{hint}</span>}
    </Command.Item>
  );
}

const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-primary";

export function CommandPalette() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [copy, setCopy] = useState<CopyState>("idle");

  // Open/close the native dialog to match state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Stop the page behind from scrolling while the palette is open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Ctrl/Cmd + K, and the nav button
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const openExternal = (href: string) => {
    setOpen(false);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopy("done");
    } catch {
      setCopy("failed");
    }
    setTimeout(() => setCopy("idle"), 2500);
  }

  const isDark = resolvedTheme === "dark";
  const copyLabel =
    copy === "done" ? "Email copied" : copy === "failed" ? `Couldn't copy. It's ${site.email}` : "Copy email address";

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      data-lenis-prevent
      onClose={() => {
        setOpen(false);
        setQuery("");
      }}
      onClick={(e) => {
        // A click on the dimmed area (the dialog itself) closes it
        if (e.target === e.currentTarget) setOpen(false);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none items-start justify-center bg-black/50 p-4 pt-[12vh] text-foreground backdrop-blur-sm open:flex"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-foreground/10 bg-card shadow-2xl">
        <Command label="Command palette" loop>
          <div className="flex items-center gap-3 border-b border-foreground/10 px-4">
            <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Type a command or search…"
              className="h-14 w-full bg-transparent outline-none placeholder:text-muted"
            />
          </div>

          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted">No results found.</Command.Empty>

            <Command.Group heading="// go to" className={groupClass}>
              {site.nav.map((item) => (
                <PaletteItem
                  key={item.href}
                  icon={Hash}
                  label={item.label}
                  value={`section ${item.label}`}
                  onSelect={() => go(item.href)}
                />
              ))}
            </Command.Group>

            <Command.Group heading="// projects" className={groupClass}>
              {projects.map((p) => (
                <PaletteItem
                  key={p.slug}
                  icon={FolderOpen}
                  label={p.title}
                  value={`project ${p.title}`}
                  hint="case study"
                  keywords={p.stack.flatMap((g) => g.items)}
                  onSelect={() => go(`/projects/${p.slug}`)}
                />
              ))}
            </Command.Group>

            <Command.Group heading="// actions" className={groupClass}>
              <PaletteItem
                icon={isDark ? Sun : Moon}
                label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                value="toggle theme"
                keywords={["dark", "light", "theme", "appearance"]}
                onSelect={() => {
                  setTheme(isDark ? "light" : "dark");
                  setOpen(false);
                }}
              />
              <PaletteItem
                icon={copy === "done" ? Check : Copy}
                label={copyLabel}
                value="copy email"
                keywords={["contact", "mail"]}
                onSelect={copyEmail}
              />
              <PaletteItem
                icon={Download}
                label="Open CV"
                value="open cv resume"
                keywords={["resume", "pdf"]}
                onSelect={() => openExternal(site.cvPath)}
              />
              <PaletteItem
                icon={ExternalLink}
                label="Open GitHub"
                value="open github"
                onSelect={() => openExternal(site.links.github)}
              />
              <PaletteItem
                icon={ExternalLink}
                label="Open LinkedIn"
                value="open linkedin"
                onSelect={() => openExternal(site.links.linkedin)}
              />
            </Command.Group>
          </Command.List>
        </Command>

        <p
          aria-hidden="true"
          className="hidden items-center gap-4 border-t border-foreground/10 px-4 py-3 font-mono text-xs text-muted md:flex"
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </p>

        <p role="status" className="sr-only">
          {copy === "done" ? "Email address copied" : ""}
        </p>
      </div>
    </dialog>
  );
}
