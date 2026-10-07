"use client";

import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { OPEN_PALETTE_EVENT } from "@/lib/command-palette";

const subscribe = () => () => {};
const getIsMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);
const getServerIsMac = () => false;

export function PaletteTrigger() {
  const isMac = useSyncExternalStore(subscribe, getIsMac, getServerIsMac);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
      aria-label="Open command palette"
      aria-keyshortcuts="Control+K Meta+K"
      className="flex h-9 items-center gap-2 rounded-full border border-foreground/10 px-3 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Search className="size-4" aria-hidden="true" />
      <kbd className="hidden font-mono text-xs lg:inline">{isMac ? "⌘ K" : "Ctrl K"}</kbd>
    </button>
  );
}
