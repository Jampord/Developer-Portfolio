import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { en } from "../content/en";

/** A slim bar for lab pages: a way back to the portfolio and the theme toggle */
export function LabHeader() {
  return (
    <header className="mx-auto w-[calc(100%-2rem)] max-w-6xl pt-4">
      <div className="flex items-center justify-between rounded-full border border-foreground/10 bg-card/80 py-2 pl-4 pr-2 backdrop-blur-md">
        <Link
          href="/"
          className="tap-target inline-flex items-center gap-2 rounded-full py-1.5 pr-2 text-sm transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {en.header.back}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
