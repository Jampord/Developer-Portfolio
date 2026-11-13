"use client";

import { Plus, RotateCcw } from "lucide-react";
import { en } from "../content/en";

type Props = {
  canAddFile: boolean;
  onNewFile(): void;
  onReset(): void;
  className?: string;
};

const button =
  "tap-target inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3.5 py-1.5 font-mono text-sm text-foreground shadow-sm pressable hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

/** A taskbar along the bottom of the demo desktop */
export function DemoToolbar({ canAddFile, onNewFile, onReset, className = "" }: Props) {
  const t = en.demo.toolbar;
  return (
    <div role="group" aria-label={t.label} className={`flex items-center justify-end gap-2 px-3 ${className}`}>
      {/* aria-disabled keeps the button focusable, so pressing it can explain why nothing happened */}
      <button type="button" aria-disabled={!canAddFile} onClick={onNewFile} className={button}>
        <Plus aria-hidden="true" className="size-4" />
        {t.newFile}
      </button>
      <button type="button" onClick={onReset} className={button}>
        <RotateCcw aria-hidden="true" className="size-4" />
        {t.reset}
      </button>
    </div>
  );
}
